from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    status: Literal["todo", "in_progress", "done"] = "todo"
    priority: Literal["low", "medium", "high"] = "medium"


class TaskRead(TaskCreate):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskSuggestion(BaseModel):
    title: str
    subtasks: list[str]
    provider: str
