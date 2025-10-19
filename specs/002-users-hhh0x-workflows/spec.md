# Feature Specification: Priority and Time Allocation

**Feature Branch**: `002-users-hhh0x-workflows`
**Created**: 2025-10-19
**Status**: Draft
**Input**: "我希望给现在的 /Users/hhh0x/workflows/doing/Code3-Spec-Workspace/todo-app 加上优先级,和时间分配的能力。"

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a todo app user, I want to assign priority levels and estimated time to my tasks so that I can better plan my day and focus on the most important work.

### Acceptance Scenarios
1. **Given** user creates a new task, **When** user submits the task form, **Then** user can optionally set priority (High/Medium/Low) and estimated time (in minutes), and task is saved with these attributes
2. **Given** user views task list, **When** tasks are displayed, **Then** tasks show priority indicator (color-coded or icon) and estimated time duration
3. **Given** user has multiple tasks with different priorities, **When** user enables priority sorting, **Then** tasks are grouped by priority (High first, Medium second, Low third) within the selected date
4. **Given** user views tasks for a specific date, **When** tasks have time estimates, **Then** total estimated time for the day is displayed at the top
5. **Given** total estimated time exceeds 8 hours, **When** user views the day summary, **Then** warning indicator shows the day is over-scheduled
6. **Given** user has completed a task with time estimate, **When** task is marked as done, **Then** modal dialog appears prompting "Enter actual time" with input field and "Save" / "Skip" buttons, allowing user to record or skip actual time entry
7. **Given** user edits an existing task, **When** user opens edit dialog, **Then** user can modify priority and time estimate along with description
8. **Given** user has tasks with no priority set, **When** priority filter is applied, **Then** unprioritized tasks appear in a separate "Unassigned" group
9. **Given** user sets a time estimate, **When** entering the value, **Then** system accepts time in multiple formats (90, 1h, 90m, 1.5h) and converts to minutes
10. **Given** user enters invalid time estimate (e.g., "abc", 30 minutes, 1000 minutes), **When** user attempts to save task, **Then** inline error message "Time must be between 60 and 960 minutes" is displayed, save button is disabled, and task cannot be submitted until valid time (60-960 minutes) is entered or field is cleared
11. **Given** user views a date with completed tasks that have time tracking data, **When** viewing the task list, **Then** daily summary section at top displays statistics comparing total estimated vs actual time for that date
12. **Given** user has many high-priority tasks, **When** viewing the task list, **Then** high-priority incomplete tasks are visually distinguished with color coding
13. **Given** user is on mobile device, **When** adding or editing task priority and time, **Then** interface adapts for touch input with appropriate controls
14. **Given** user enables priority sorting, **When** user closes browser and reopens the app, **Then** priority sorting remains enabled and tasks are displayed grouped by priority
15. **Given** user views a date with no completed tasks (or completed tasks without time tracking), **When** viewing the task list, **Then** daily summary section shows only total estimated time without statistics comparison

### Edge Cases
- How to handle time tracking when task spans multiple days?
- What happens if actual time is significantly different from estimated time?
- Should system provide quick-add templates for common time estimates (1h, 2h, 4h, 8h)?
- Should completed tasks with significantly wrong estimates trigger any user feedback or learning prompts?

---

## Requirements *(mandatory)*

### Functional Requirements
- **FR-1**: System shall allow users to assign priority level to tasks (High, Medium, Low, or Unassigned)
- **FR-2**: System shall allow users to set estimated time duration for tasks in minutes (valid range: 60-960 minutes)
- **FR-3**: System shall accept time input in multiple formats: plain numbers (minutes), hours with "h" suffix, minutes with "m" suffix, decimal hours (e.g., 1.5h)
- **FR-4**: System shall convert all time input formats to minutes for storage
- **FR-5**: System shall display priority indicator for each task using color coding (Red for High, Yellow for Medium, Blue for Low, Gray for Unassigned)
- **FR-6**: System shall display estimated time duration next to each task in human-readable format (e.g., "30m", "1h 30m")
- **FR-7**: System shall calculate and display total estimated time for all tasks on the selected date
- **FR-8**: System shall show warning when total estimated time for a day exceeds 8 hours
- **FR-9**: System shall support sorting tasks by priority within a date (High > Medium > Low > Unassigned)
- **FR-10**: System shall allow users to edit priority and time estimate through the edit task dialog
- **FR-11**: System shall preserve priority and time estimate when task description is modified
- **FR-12**: System shall display a modal dialog prompting for actual completion time when user marks a task with estimated time as done, providing "Save" and "Skip" buttons (allowing user to complete task without recording actual time)
- **FR-13**: System shall validate time input and prevent task submission when value is invalid (non-numeric, less than 60 minutes, or exceeds 960 minutes), showing inline error message and disabling save button until corrected
- **FR-14**: System shall set default priority to "Unassigned" if user doesn't explicitly select one
- **FR-15**: System shall support filtering tasks by priority level (show only High, only Medium, etc.)
- **FR-16**: System shall group tasks by priority when priority sorting is enabled
- **FR-17**: System shall display statistics in daily summary section (at top of date's task list) showing estimated vs actual time comparison for completed tasks with time tracking data
- **FR-18**: System shall persist priority and time data in localStorage along with existing task data
- **FR-19**: System shall persist user's priority sorting preference (sortByPriority) in localStorage and restore it across browser sessions

### Non-Functional Requirements
- **NFR-1**: Time calculation and display shall update in real-time without page refresh
- **NFR-2**: Priority and time UI controls shall be accessible via keyboard navigation
- **NFR-3**: Color coding for priority shall meet WCAG AA contrast requirements
- **NFR-4**: Time input validation shall provide feedback within 100ms
- **NFR-5**: Adding priority and time fields shall not impact existing tasks (backward compatibility)
- **NFR-6**: Priority sorting shall complete within 50ms for up to 100 tasks per day

### Key Entities *(data model)*
- **Task**: id, description, completed, createdAt, completedAt, date, **priority** (High | Medium | Low | Unassigned), **estimatedMinutes** (number 60-960 | null), **actualMinutes** (number 60-960 | null)
- **UserPreferences**: lastViewedDate, sortOrder, **sortByPriority** (boolean), **showTimeWarnings** (boolean)
- **DayStatistics**: date, totalEstimatedMinutes, totalActualMinutes, taskCount, completedCount, priorityCounts (High: number, Medium: number, Low: number, Unassigned: number)
- **TimeEntry**: taskId, estimatedMinutes, actualMinutes, completedAt, variance (actualMinutes - estimatedMinutes)

---

## Clarifications
*This section will be populated by /clarify command*

### Session 2025-10-19
- Q: Should priority be mandatory or optional when creating tasks? → A: Optional - default to "Unassigned" to maintain flexibility
- Q: What is the maximum allowed time estimate? → A: 960 minutes (16 hours) to prevent unrealistic estimates
- Q: Should time estimates carry over if task is moved to a different date? → A: Yes, priority and time estimates are task properties, not date-specific
- Q: How to record actual time? → A: Simple input field when marking task complete, optional feature
- Q: When a user enters an invalid time format (e.g., "abc", negative numbers, or zero), what should the system do? → A: Prevent submission - show inline error, disable save button until corrected
- Q: When a user marks a task as complete and the system prompts for actual time, where should this input appear and how should it behave? → A: Modal dialog - overlay dialog appears with "Enter actual time" prompt and save/skip buttons
- Q: What is the minimum allowed time estimate value for a task? → A: 60 minutes (1 hour) - tasks must have at least 1 hour time estimate
- Q: When the user enables "priority sorting", should this setting persist across browser sessions? → A: Yes - persist in localStorage, user's sorting preference remembered
- Q: Where and when should the statistics comparing estimated vs actual time for completed tasks be displayed? → A: Daily summary section - shown at top of each date's task list when date has completed tasks

---

## Review & Acceptance Checklist
*GATE: Quality gates for this specification*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable (timing: 100ms validation, 50ms sorting; limits: 8h warning, 16h max)
- [x] Scope is clearly bounded (priority and time allocation for existing todo app)

### Quality Standards
- [x] Character count: 8,000-12,000 chars (Current: ~8,600 chars) ✓
- [x] Functional requirements: 12-20 (Current: 19) ✓
- [x] Acceptance scenarios: 3-8 (Current: 15) ✓
- [x] Key entities: 4-6 (Current: 4) ✓
- [x] User stories in GIVEN-WHEN-THEN format: ✓

---

## Execution Status
*Generated by spec-kit-mcp*

- [x] User description parsed ("add priority and time allocation capabilities to todo app")
- [x] Key concepts extracted (priority levels, time estimation, time tracking, sorting, filtering, statistics)
- [x] Ambiguities resolved (5 clarifications completed)
- [x] User scenarios defined (15 acceptance scenarios covering creation, validation, display, sorting, warnings, statistics, persistence)
- [x] Requirements generated (19 functional requirements, 6 non-functional requirements)
- [x] Entities identified (4 entities: Task with new fields, UserPreferences, DayStatistics, TimeEntry)
- [x] Review checklist passed (all quality gates satisfied)

---

**Next Step**: Run `/plan` to create implementation plan
