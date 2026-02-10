---
title: Workspace Merchant Rules
description: Learn how to enable and use Workspace Merchant Rules to automatically apply consistent expense coding based on the merchant name.
keywords: [New Expensify, workspace merchant rules, merchant rules, auto-categorize by merchant, expense automation, expense rules, workspace settings]
internalScope: Audience is Workspace Admins on the Control plan. Covers enabling and using Workspace Merchant Rules to apply consistent expense coding based on merchant name. Does not cover personal expense rules, Category Rules, Tag Rules, or troubleshooting rule conflicts.
---

Enable Workspace Merchant Rules to help Workspace Admins standardize how expenses from common merchants are coded across the workspace. These rules automatically apply consistent categories, tags, and other expense fields based on the merchant name, reducing manual cleanup and improving reporting accuracy.

Once set up, Workspace Merchant Rules evaluate expenses when they're created and apply the selected updates automatically.

- Works in **New Expensify**
- Can only be configured in **New Expensify**
- Applies consistently across all members in the workspace

---

# Set Up Workspace Merchant Rules

To create a Workspace Merchant Rule:

1. In the **navigation tabs** (on the left on web, and at the bottom on mobile), click **Workspaces**.
2. Click your **workspace name**.
3. Click **Rules**, then **Expenses**.
4. Scroll to the **Merchant** section.
5. Click **Add merchant rule**.
6. Enter the merchant name and choose how it should match:
   - **Contains**
   - **Matches exactly**
7. Select the fields you want the rule to update: 
   - **Merchant** to update the merchant name. 
   - **Category** to update the expense category. 
   - **Tag** to update the expense tag. 
   - **Description** to update the expense description 
   - **Reimbursable** to update whether the expense is reimbursable or non-reimbursable.
8. Select whether the rule should be applied to existing unsubmitted expenses and preview matches (optional). 
9. Select **Save Rule**

**Note:** Workspace Merchant Rules are only available after **Workspace Rules** are enabled for the workspace. If you don't see the Merchant Rules section, first [enable Workspace Rules](https://help.expensify.com/articles/new-expensify/workspaces/Workspace-Rules#enable-workspace-rules). 

---

# When a Workspace Merchant Rule Applies

When an expense matches a Workspace Merchant Rule:

- The rule is applied **when the expense is created**. It isn't applied if the expense is edited later.
- If multiple Workspace Merchant Rules match the same expense, **only the earliest created rule is applied**.
- If a member manually sets a field when creating the expense, **that field won't be updated by the rule**.

---

# Best Practices

Follow these guidelines to ensure Workspace Merchant Rules work predictably:

## Use Specific Merchant Names

- Start with exact matching for common vendors (e.g., "Uber", "Slack") to avoid false matches.
- Use "contains" matching carefully—a rule for "Delta" will also match "Delta Airlines", "Delta Hotel", etc.

## Avoid Overlapping Rules

- If you have multiple rules that could match the same merchant, only the first one created will apply.
- Review your rules list regularly to identify potential conflicts.

## Test Rules Before Rolling Out

- Use the "Preview matching expenses" option when creating a rule to see what will be affected.
- Start with a narrow rule and expand gradually rather than creating broad rules immediately.

## Document Your Rules

- Use clear, descriptive merchant names in your rules.
- Keep a record of which rules cover which merchant types or expense categories.

---

# Common Use Cases

## Standardize Rideshare Expenses

**Problem**: Team members categorize Uber/Lyft expenses inconsistently.

**Solution**: Create rules for:
- Merchant contains "Uber" → Category: Travel, Tag: Ground Transportation, Reimbursable: Yes
- Merchant contains "Lyft" → Category: Travel, Tag: Ground Transportation, Reimbursable: Yes

## Handle SaaS Subscriptions

**Problem**: Recurring software subscriptions need consistent non-reimbursable coding.

**Solution**: Create rules for:
- Merchant contains "Slack" → Category: Software, Reimbursable: No, Billable: No
- Merchant contains "Adobe" → Category: Software, Reimbursable: No, Billable: No

## Standardize Merchant Names

**Problem**: The same vendor appears with different variations (e.g., "Starbucks #1234", "Starbucks Store 5678").

**Solution**: Create a rule:
- Merchant contains "Starbucks" → Merchant: Starbucks, Category: Meals & Entertainment

## Office Supply Consistency

**Problem**: Office supply purchases need specific billing codes and tags.

**Solution**: Create rules for:
- Merchant contains "Staples" → Category: Office Supplies, Tag: Office, Description: Office supplies purchase
- Merchant contains "Amazon Business" → Category: Office Supplies, Tag: Office

---

# FAQ

## Who Can Enable Workspace Merchant Rules?

Only **Workspace Admins** on the **Control** plan can create, edit, or delete Workspace Merchant Rules.

## What Fields Can Workspace Merchant Rules Update?

Workspace Merchant Rules can update expense fields such as the category, tag, reimbursable status, billable status, tax, merchant name, and description.

## Do Workspace Merchant Rules Change How Employees Submit Expenses?

No. Employees submit expenses the same way as before. Workspace Merchant Rules run automatically in the background.

## What Happens if a Personal Rule and a Workspace Merchant Rule Both Apply?

Personal expense rules take precedence over Workspace Merchant Rules.

## How Can I Tell Which Rule Was Applied?

When a Workspace Merchant Rule is applied to an expense, you can verify it by:

1. Opening the expense details.
2. Looking for the rule indicator in the expense history or field labels.
3. Checking the expense chat for automated updates logged by the system.

If a field was updated by a rule, the change will appear in the expense's audit trail.

## Why Didn't My Workspace Merchant Rule Apply?

Common reasons include:
- **Merchant name didn't match**: The merchant string on the expense doesn't contain (or exactly match) the text specified in your rule. Check for typos, extra spaces, or special characters.
- **Rule is disabled**: Verify the rule is active in your Workspace Rules settings.
- **Another rule matched first**: If multiple rules match the same merchant, only the earliest-created rule applies. Check your rule order.
- **Field was manually set**: If a member manually selected a category or tag when creating the expense, the rule won't override it.
- **Rule was created after the expense**: Rules only apply when an expense is created, not retroactively (unless you select "apply to existing expenses" when creating the rule).

