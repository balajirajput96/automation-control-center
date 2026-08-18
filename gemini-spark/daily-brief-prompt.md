# Gemini Spark Daily Brief Prompt

Every day at 08:00 local time, review only the Google apps that I have explicitly connected: Gmail, Calendar, Drive, Docs, Sheets, and Slides. Produce a private briefing delivered to the designated private Google Drive report folder and adhering strictly to the structured output contract below.

## Output Destination

Save each daily briefing document to the existing private Google Drive destination folder:
- **Folder Name**: `Automation Control Center`
- **Folder ID**: `18l-M8C00XpE6l3kxn1tSkp6vNi0SJcOR`
- **File Name Format**: `daily-brief_YYYY-MM-DD.md` (or Google Doc titled `Daily Automation Briefing — YYYY-MM-DD`)

## Structured Output Contract

The briefing must be structured with the following exact sections and formatting:

```markdown
# Daily Automation Briefing — [YYYY-MM-DD]

## 1. Top Three Priorities
- [Priority 1]: Description, owner, and expected outcome for today
- [Priority 2]: Description, owner, and expected outcome for today
- [Priority 3]: Description, owner, and expected outcome for today

## 2. Urgent Items
- **[Source App]** [Item Title]: Immediate deadline or time-sensitive issue

## 3. Today's Calendar
- **[Time]** [Event Title]: Attendees, agenda, or key context

## 4. Overdue Follow-ups
- **[Source App]** [Item Title]: Days overdue and required follow-up action

## 5. Automation Blockers
- **[Component/Flow]** [Issue Title]: Blocker details and operational impact

## 6. Documents Requiring Review
- **[Source App]** [Document Title]: Review request details, author, and deadline

## 7. Approval Needed
- **[Proposed Action]**: Target system, rationale, and drafted action awaiting explicit human approval
```

### Contract Requirements
- All headings (`top three priorities`, `urgent items`, `today's calendar`, `overdue follow-ups`, `automation blockers`, `documents requiring review`, and `approval needed`) must be included in every generated briefing.
- If there are no items for a specific section, write `None`.
- Always cite the source app and item title for each line item.
- Do not create fictitious items; summarize only verified data from connected Google apps.

## Operational Constraints

Do not send email, create calendar events, modify files, share documents, spend money, or make bookings. When a potential action is identified, draft the proposed action and place it in the `approval needed` section. Keep the briefing concise, cite the source app and item title where possible, and prioritize time-sensitive work.

This task should be configured as a daily time-based Gemini Spark schedule only after the Google account is signed in, Gemini Spark is available, and the selected apps have been intentionally enabled.
