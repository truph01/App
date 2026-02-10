---
title: Workspace Merchant Rules
description: Learn how to enable and use Workspace Merchant Rules to automatically apply consistent expense coding based on the merchant name.
keywords: [New Expensify, workspace merchant rules, merchant rules, auto-categorize by merchant, expense automation, expense rules, workspace settings]
internalScope: Audience is Workspace Admins on the Control plan. Covers enabling and using Workspace Merchant Rules to apply consistent expense coding based on merchant name. Does not cover personal expense rules, Category Rules, Tag Rules, or troubleshooting rule conflicts.
---

Enable Workspace Merchant Rules to help Workspace Admins standardize how expenses from common merchants are coded across the workspace. These rules automatically apply consistent categories, tags, and other expense fields based on the merchant name, reducing manual cleanup and improving reporting accuracy.

Once set up, Workspace Merchant Rules evaluate expenses when they’re created and apply the selected updates automatically.

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

**Note:** Workspace Merchant Rules are only available after **Workspace Rules** are enabled for the workspace. If you don’t see the Merchant Rules section, first [enable Workspace Rules](https://help.expensify.com/articles/new-expensify/workspaces/Workspace-Rules#enable-workspace-rules). 

---

# When a Workspace Merchant Rule Applies

When an expense matches a Workspace Merchant Rule:

- The rule is applied **when the expense is created**. It isn’t applied if the expense is edited later.
- If multiple Workspace Merchant Rules match the same expense, **only the earliest created rule is applied**.
- If a member manually sets a field when creating the expense, **that field won’t be updated by the rule**.

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

## Why Didn’t My Workspace Merchant Rule Apply?

Common reasons include:
- The merchant name didn’t match the rule.
- The rule was disabled.
- Another Workspace Merchant Rule matched first.
- A field was manually set when the expense was created.


