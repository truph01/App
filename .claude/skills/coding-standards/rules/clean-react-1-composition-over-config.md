---
ruleId: CLEAN-REACT-PATTERNS-1
title: Favor composition over configuration
---

## [CLEAN-REACT-PATTERNS-1] Favor composition over configuration

### Reasoning

When features are implemented by adding configuration to components — whether boolean flags, optional content props, or large prop interfaces — the component must be modified every time a consumer needs different behavior. This increases coupling, surface area, and regression risk at scale. Composition treats features as independent building blocks: a Provider manages shared state, sub-components (blocks) render independently via context or direct props, and consumers add/remove features by including or excluding blocks. The component never changes. This applies equally to simple widgets and complex multi-feature UIs.

Reference: [Composition Pattern Guide](https://composition-pattern-starter.vercel.app/comparison)

### Incorrect

#### Incorrect (configuration — boolean flags)

- Features controlled by boolean flags
- Adding a new feature requires modifying the component's API and internals

```tsx
<Table
  data={items}
  columns={columns}
  shouldShowSearchBar
  shouldShowHeader
  shouldEnableSorting
  shouldShowPagination
  shouldHighlightOnHover
/>

type TableProps = {
  data: Item[];
  columns: Column[];
  shouldShowSearchBar?: boolean;    // Could be <Table.SearchBar />
  shouldShowHeader?: boolean;       // Could be <Table.Header />
  shouldEnableSorting?: boolean;    // Configuration for header behavior
  shouldShowPagination?: boolean;   // Could be <Table.Pagination />
  shouldHighlightOnHover?: boolean; // Configuration for styling behavior
};
```

#### Incorrect (configuration — content props)

- Optional content props control which UI elements appear
- Each optional prop maps 1:1 to a conditional render block inside the component
- Adding a new element (e.g., badge) requires modifying the component's props AND internals

```tsx
<BaseWidgetItem
    icon={icon}
    iconBackgroundColor={theme.widgetIconBG}
    iconFill={theme.widgetIconFill}
    title={translate(translationKey, {count})}
    subtitle={subtitle}
    ctaText={translate('homePage.forYouSection.begin')}
    onCtaPress={handler}
/>

// Inside the component — conditional rendering controlled by props:
function BaseWidgetItem({icon, iconBackgroundColor, title, subtitle, ctaText, onCtaPress, iconFill}: BaseWidgetItemProps) {
    return (
        <View>
            <View style={styles.getWidgetItemIconContainerStyle(iconBackgroundColor)}>
                <Icon src={icon} fill={iconFill ?? theme.white} />
            </View>
            <View>
                {!!subtitle && <Text style={styles.widgetItemSubtitle}>{subtitle}</Text>}  // ❌ Prop exists solely for this conditional
                <Text style={styles.widgetItemTitle}>{title}</Text>
            </View>
            <Button text={ctaText} onPress={onCtaPress} />
        </View>
    );
}
```

#### Incorrect (configuration — monolithic prop interface)

- All features threaded through props
- Every piece of state and behavior configured from outside
- Adding a new feature (e.g., a new tab, a new button) requires expanding the prop interface

```tsx
<SettingsDialog
    isOpen={isOpen}
    onClose={onClose}
    title="Settings"
    description="Manage your preferences"
    tabs={tabs}
    activeTab={activeTab}
    onTabChange={handleTabChange}
    onSave={handleSave}
    onReset={handleReset}
    values={formValues}
    onChange={handleChange}
    // ... props grow with every feature
/>
```

### Correct

#### Correct (composition — boolean features)

- Features expressed as composable children
- Parent stays stable; add features by adding children

```tsx
<Table data={items} columns={columns}>
  <Table.SearchBar />
  <Table.Header />
  <Table.Body />
</Table>
```

#### Correct (composition — compound component)

- UI elements are composable children the consumer includes or omits
- Adding a new element (e.g., Subtitle, Badge) never changes existing sub-components
- Each sub-component is a small, focused function with its own styles

```tsx
// Implementation — each sub-component owns its behavior:

function Container({children, onPress, accessibilityLabel}: {children: React.ReactNode; onPress?: () => void; accessibilityLabel?: string}) {
    const styles = useThemeStyles();
    const content = <View style={[styles.flexRow, styles.alignItemsCenter, styles.gap3]}>{children}</View>;

    if (onPress) {
        return (
            <PressableWithFeedback onPress={onPress} accessibilityLabel={accessibilityLabel} accessibilityRole="button">
                {content}
            </PressableWithFeedback>
        );
    }
    return content;
}

function WidgetIcon({src, backgroundColor, fill}: {src: IconAsset; backgroundColor: string; fill?: string}) {
    const styles = useThemeStyles();
    const theme = useTheme();
    return (
        <View style={styles.getWidgetItemIconContainerStyle(backgroundColor)}>
            <Icon src={src} width={variables.iconSizeNormal} height={variables.iconSizeNormal} fill={fill ?? theme.white} />
        </View>
    );
}

function Content({children}: {children: React.ReactNode}) {
    const styles = useThemeStyles();
    return <View style={[styles.flex1, styles.flexColumn, styles.justifyContentCenter]}>{children}</View>;
}

function Title({children, numberOfLines}: {children: React.ReactNode; numberOfLines?: number}) {
    const styles = useThemeStyles();
    return <Text style={styles.widgetItemTitle} numberOfLines={numberOfLines}>{children}</Text>;
}

function Subtitle({children}: {children: React.ReactNode}) {
    const styles = useThemeStyles();
    return <Text style={styles.widgetItemSubtitle}>{children}</Text>;
}

function Action({onPress, isLoading, children}: {onPress: () => void; isLoading?: boolean; children: string}) {
    const styles = useThemeStyles();
    return <Button text={children} onPress={onPress} success small isLoading={isLoading} style={styles.widgetItemButton} />;
}

const WidgetItem = {Container, Icon: WidgetIcon, Content, Title, Subtitle, Action};
export default WidgetItem;
```

```tsx
// Usage — consumer decides what to render:
<WidgetItem.Container>
    <WidgetItem.Icon src={icon} backgroundColor={theme.widgetIconBG} fill={theme.widgetIconFill} />
    <WidgetItem.Content>
        <WidgetItem.Title>{translate(translationKey, {count})}</WidgetItem.Title>
    </WidgetItem.Content>
    <WidgetItem.Action onPress={handler}>{beginText}</WidgetItem.Action>
</WidgetItem.Container>

// Need a subtitle? Add it — no changes to any existing sub-component:
<WidgetItem.Container>
    <WidgetItem.Icon src={icon} backgroundColor={theme.widgetIconBG} fill={theme.widgetIconFill} />
    <WidgetItem.Content>
        <WidgetItem.Subtitle>{subtitle}</WidgetItem.Subtitle>
        <WidgetItem.Title>{title}</WidgetItem.Title>
    </WidgetItem.Content>
    <WidgetItem.Action onPress={handler}>{beginText}</WidgetItem.Action>
</WidgetItem.Container>
```

#### Correct (composition — Provider + Blocks)

- Provider manages shared state, sub-components render independently
- Each block connects to state through context — no props between blocks
- Features are optional building blocks: add by including, remove by excluding

```tsx
<Settings.Provider>
    <Settings.Trigger>
        <Button>Open Settings</Button>
    </Settings.Trigger>

    <Settings.Dialog>
        <Settings.Header title="Settings" description="Manage your preferences" />

        <Settings.Content>
            {/* Form content */}
        </Settings.Content>

        <Settings.Footer>
            <Settings.ResetButton />
            <Settings.SaveButton />
        </Settings.Footer>
    </Settings.Dialog>
</Settings.Provider>

// No props between blocks — context manages everything
// Adding a new section doesn't change the Provider or other blocks
```

---

### Review Metadata

#### Condition

Flag when ANY of these are true:

**Case 1 — Boolean flag configuration:**
- A component uses boolean/flag props (matching the Case 1 search patterns) that cause `if/else` or ternary branching inside the component body
- These flags control feature presence, layout strategy, or behavior within the component
- These features could instead be expressed as composable child components

**Case 2 — Content prop configuration:**
- An optional content prop's **sole purpose** is to conditionally render a UI element
- The test: if removing the prop would only remove a `{!!prop && <Element />}` or `{prop ? <Element /> : null}` block and nothing else, the element should be a composable child instead
- This applies when **adding new optional content props** to new or existing components — not when modifying existing conditional rendering during a bug fix

**Detection steps for Case 2:**
1. In the diff, search for conditional rendering patterns: `{!!prop &&`, `{prop &&`, `{prop ? <...> : null}`
2. For each match, identify the variable used in the condition (e.g., `subtitle` in `{!!subtitle && <Text>...`)
3. Check the component's type definition — is this prop optional (`subtitle?: string`)?
4. Search the entire component body for other uses of this prop — is the conditional render the ONLY place it appears?
5. If yes to both (optional + sole purpose is conditional render) → flag as Case 2 violation

**Case 3 — Monolithic prop interface:**
- A component receives a large set of props that collectively configure its appearance and behavior (e.g., dialog with `isOpen`, `title`, `tabs`, `activeTab`, `onTabChange`, `onSave`, `onReset`, `values`)
- These props could be broken into independent composable blocks: Provider manages state, sub-components render independently
- The component becomes a "configuration object consumer" rather than a composition of building blocks

In all cases, the rule applies to: **new components**, **new features added to existing components**, and **refactorings that create new components still following configuration patterns**

**DO NOT flag if:**
- Props are domain identifiers used for data fetching (e.g., `reportID`, `policyID`, `transactionID`)
- Props are event handlers for abstract actions (e.g., `onPress`, `onChange`, `onSelectRow`)
- Props are structural/presentational (e.g., `style`, `testID`)
- The component already uses composition and child components for features
- The optional prop is used for logic beyond just conditional rendering (e.g., computing derived values, passed to callbacks, used in multiple places within the component)
- The component is a thin wrapper around a platform primitive (e.g., wrapping `TextInput`, `ScrollView`, `Pressable`) — these naturally pass through configuration props

**Search Patterns** (hints for reviewers):
- **Case 1**: `should\w+`, `can\w+`, `enable`, `disable` (boolean flag prefixes in prop types)
- **Case 2**: `{!!`, `&&\s*<`, `?\s*<`, `: null`, combined with optional prop markers (`?:` in type definitions)
- **Case 3**: Components with 8+ props in their type definition, especially mixing state/handler/content props
