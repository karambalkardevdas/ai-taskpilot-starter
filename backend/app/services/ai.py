def suggest_subtasks(title: str) -> dict:
    clean_title = title.strip()

    if not clean_title:
        raise ValueError("Task title cannot be empty")

    return {
        "title": clean_title,
        "subtasks": [
            f"Plan: {clean_title}",
            f"Implement: {clean_title}",
            f"Test and review: {clean_title}",
        ],
        "provider": "mock",
    }
