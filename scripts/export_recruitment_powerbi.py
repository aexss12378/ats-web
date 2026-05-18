#!/usr/bin/env python3
"""把 json-server 的 ATS 資料整理成 Power BI 可匯入的 CSV。"""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


STAGE_LABELS = {
    1: "初審",
    2: "一面",
    3: "二面",
    4: "主管面試",
    5: "人選會",
    6: "錄取確認",
    7: "到職準備",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="從 db.json 產生 Power BI 用的招募資料表。"
    )
    parser.add_argument("--input", default="db.json", help="來源 db.json 路徑")
    parser.add_argument("--output", default="powerbi-export", help="CSV 輸出資料夾")
    return parser.parse_args()


def load_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as file:
        return json.load(file)


def write_csv(path: Path, rows: list[dict[str, Any]], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def days_since(value: Any, now: datetime) -> int:
    date = parse_datetime(value)
    if not date:
        return 0
    if date.tzinfo is None:
        date = date.replace(tzinfo=timezone.utc)
    return max(0, (now - date).days)


def iso_date(value: Any) -> str:
    date = parse_datetime(value)
    return date.isoformat() if date else ""


def as_int(value: Any) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def job_status(job: dict[str, Any]) -> str:
    return str(job.get("jobStatus") or job.get("status") or "")


def build_dim_jobs(jobs: list[dict[str, Any]], now: datetime) -> list[dict[str, Any]]:
    rows = []
    for job in jobs:
        applicant_count = as_int(job.get("applicantCount") or len(job.get("applicants", [])))
        manager_not_replied = as_int(job.get("managerNotReplied"))
        risk_level = "低"
        blocker = "流程正常"
        wait_days = 0
        if applicant_count == 0:
            wait_days = days_since(job.get("createdDate"), now)
            risk_level = "中" if wait_days >= 5 else "低"
            blocker = "沒有應徵者"
        elif manager_not_replied > 0:
            risk_level = "高"
            blocker = "主管待辦未完成"

        rows.append(
            {
                "job_id": job.get("id", ""),
                "job_title": job.get("jobTitle", ""),
                "department": job.get("department", "未指定"),
                "manager": job.get("manager", "尚未指定"),
                "job_status": job_status(job),
                "created_date": iso_date(job.get("createdDate")),
                "applicant_count": applicant_count,
                "manager_not_replied": manager_not_replied,
                "manager_replied": as_int(job.get("managerReplied")),
                "first_interview": as_int(job.get("firstInterview")),
                "joint_interview": as_int(job.get("jointInterview")),
                "selection_meeting": as_int(job.get("selectionMeeting")),
                "hired_count": as_int(job.get("hiredCount")),
                "onboarding_count": as_int(job.get("onBoarding")),
                "risk_level": risk_level,
                "blocker": blocker,
                "wait_days": wait_days,
            }
        )
    return rows


def build_candidate_pipeline(
    tracked_applicants: list[dict[str, Any]], jobs_by_title: dict[str, dict[str, Any]], now: datetime
) -> list[dict[str, Any]]:
    rows = []
    for applicant in tracked_applicants:
        job_title = applicant.get("jobTitle", "")
        job = jobs_by_title.get(job_title, {})
        process_step_id = as_int(applicant.get("processStepId"))
        owner = applicant.get("supervisor") or job.get("manager") or "尚未指定"
        process_updated_at = applicant.get("processUpdatedAt") or applicant.get("sentTime")
        rows.append(
            {
                "candidate_id": applicant.get("id") or applicant.get("applicantId", ""),
                "candidate_name": applicant.get("applicantName", ""),
                "job_id": job.get("id", ""),
                "job_title": job_title,
                "current_stage": STAGE_LABELS.get(process_step_id, "未分類"),
                "stage_status": applicant.get("stepStatus", ""),
                "task_status": applicant.get("taskStatus", ""),
                "initial_review_status": applicant.get("initialReviewStatus", ""),
                "owner": owner,
                "sent_time": iso_date(applicant.get("sentTime")),
                "manager_response_due_at": iso_date(applicant.get("managerResponseDueAt")),
                "manager_responded_at": iso_date(applicant.get("managerRespondedAt")),
                "process_updated_at": iso_date(process_updated_at),
                "wait_days": days_since(process_updated_at, now),
                "interview_session_id": applicant.get("interviewSessionId", ""),
            }
        )
    return rows


def build_interview_feedback(
    sessions: list[dict[str, Any]],
    applicants_by_id: dict[str, dict[str, Any]],
    interviewers_by_id: dict[str, dict[str, Any]],
    now: datetime,
) -> list[dict[str, Any]]:
    rows = []
    for session in sessions:
        applicant = applicants_by_id.get(str(session.get("applicantId")), {})
        for feedback in session.get("feedbacks", []):
            interviewer = interviewers_by_id.get(str(feedback.get("interviewerId")), {})
            deadline = session.get("feedbackDeadline")
            rows.append(
                {
                    "session_id": session.get("id", ""),
                    "candidate_id": session.get("applicantId", ""),
                    "candidate_name": applicant.get("applicantName", "未知應聘者"),
                    "job_title": applicant.get("jobTitle", "未知職缺"),
                    "round": session.get("round", ""),
                    "interview_time": iso_date(session.get("scheduledTime")),
                    "feedback_deadline": iso_date(deadline),
                    "interviewer_id": feedback.get("interviewerId", ""),
                    "interviewer_name": interviewer.get("name", ""),
                    "interviewer_department": interviewer.get("department", ""),
                    "submitted": feedback.get("submitted", False),
                    "submitted_time": iso_date(feedback.get("submittedTime")),
                    "wait_days": as_int(feedback.get("waitDays")) or days_since(deadline, now),
                    "comment": feedback.get("comment", ""),
                }
            )
    return rows


def build_automation_tasks(
    jobs: list[dict[str, Any]],
    tracked_applicants: list[dict[str, Any]],
    feedback_rows: list[dict[str, Any]],
    now: datetime,
) -> list[dict[str, Any]]:
    rows = []
    for applicant in tracked_applicants:
        if applicant.get("taskStatus") in {"待主管回覆", "已提醒", "已逾期"}:
            rows.append(
                {
                    "task_name": "主管待辦提醒",
                    "tool": "Power Automate",
                    "trigger_condition": "履歷送出後超過 2 天仍未回覆",
                    "owner": applicant.get("supervisor", "用人主管"),
                    "target": f"{applicant.get('applicantName', '')}｜{applicant.get('jobTitle', '')}",
                    "priority": "高" if days_since(applicant.get("sentTime"), now) >= 2 else "中",
                    "wait_days": days_since(applicant.get("sentTime"), now),
                    "source_field": "trackedApplicants.sentTime",
                    "expected_output": "提醒主管完成初審並回寫提醒時間",
                }
            )

    for feedback in feedback_rows:
        if not feedback["submitted"]:
            rows.append(
                {
                    "task_name": "面試回饋催收",
                    "tool": "Power Automate",
                    "trigger_condition": "面試回饋期限到期或等待超過 1 天",
                    "owner": feedback["interviewer_name"],
                    "target": f"{feedback['candidate_name']}｜{feedback['job_title']}",
                    "priority": "高" if as_int(feedback["wait_days"]) >= 2 else "中",
                    "wait_days": feedback["wait_days"],
                    "source_field": "interviewSessions.feedbacks.submitted",
                    "expected_output": "寄送回饋提醒並彙整逾期清單給人資",
                }
            )

    for job in jobs:
        applicant_count = as_int(job.get("applicantCount") or len(job.get("applicants", [])))
        if applicant_count == 0:
            rows.append(
                {
                    "task_name": "履歷來源檢查",
                    "tool": "Python",
                    "trigger_condition": "職缺開放超過 5 天且應徵人數為 0",
                    "owner": job.get("manager", "人資"),
                    "target": job.get("jobTitle", ""),
                    "priority": "中",
                    "wait_days": days_since(job.get("createdDate"), now),
                    "source_field": "jobs.applicantCount",
                    "expected_output": "列入每週招募補量清單",
                }
            )
    return rows


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    output_dir = Path(args.output)
    data = load_json(input_path)
    now = datetime.now(timezone.utc)

    jobs = data.get("jobs", [])
    tracked_applicants = data.get("trackedApplicants", [])
    sessions = data.get("interviewSessions", [])
    interviewers = data.get("interviewers", [])

    jobs_by_title = {job.get("jobTitle", ""): job for job in jobs}
    applicants_by_id = {str(applicant.get("id") or applicant.get("applicantId")): applicant for applicant in tracked_applicants}
    interviewers_by_id = {str(interviewer.get("id")): interviewer for interviewer in interviewers}

    dim_jobs = build_dim_jobs(jobs, now)
    candidate_pipeline = build_candidate_pipeline(tracked_applicants, jobs_by_title, now)
    interview_feedback = build_interview_feedback(sessions, applicants_by_id, interviewers_by_id, now)
    automation_tasks = build_automation_tasks(jobs, tracked_applicants, interview_feedback, now)

    write_csv(
        output_dir / "powerbi_dim_jobs.csv",
        dim_jobs,
        [
            "job_id",
            "job_title",
            "department",
            "manager",
            "job_status",
            "created_date",
            "applicant_count",
            "manager_not_replied",
            "manager_replied",
            "first_interview",
            "joint_interview",
            "selection_meeting",
            "hired_count",
            "onboarding_count",
            "risk_level",
            "blocker",
            "wait_days",
        ],
    )
    write_csv(
        output_dir / "powerbi_fact_candidate_pipeline.csv",
        candidate_pipeline,
        [
            "candidate_id",
            "candidate_name",
            "job_id",
            "job_title",
            "current_stage",
            "stage_status",
            "task_status",
            "initial_review_status",
            "owner",
            "sent_time",
            "manager_response_due_at",
            "manager_responded_at",
            "process_updated_at",
            "wait_days",
            "interview_session_id",
        ],
    )
    write_csv(
        output_dir / "powerbi_fact_interview_feedback.csv",
        interview_feedback,
        [
            "session_id",
            "candidate_id",
            "candidate_name",
            "job_title",
            "round",
            "interview_time",
            "feedback_deadline",
            "interviewer_id",
            "interviewer_name",
            "interviewer_department",
            "submitted",
            "submitted_time",
            "wait_days",
            "comment",
        ],
    )
    write_csv(
        output_dir / "powerbi_fact_automation_tasks.csv",
        automation_tasks,
        [
            "task_name",
            "tool",
            "trigger_condition",
            "owner",
            "target",
            "priority",
            "wait_days",
            "source_field",
            "expected_output",
        ],
    )

    print(f"已輸出 {output_dir}")
    print(f"- 職缺主檔：{len(dim_jobs)} 筆")
    print(f"- 候選人流程：{len(candidate_pipeline)} 筆")
    print(f"- 面試回饋：{len(interview_feedback)} 筆")
    print(f"- 自動化待辦：{len(automation_tasks)} 筆")


if __name__ == "__main__":
    main()
