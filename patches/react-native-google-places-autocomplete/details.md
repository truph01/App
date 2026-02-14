# `react-native-google-places-autocomplete` patches

### [react-native-google-places-autocomplete+2.5.6+001+react-19-support.patch](react-native-google-places-autocomplete+2.5.6+001+react-19-support.patch)

- Reason:
  
    ```
    This patch supports for React 19 by removing propTypes.
    ```
  
- Upstream PR/issue: https://github.com/FaridSafi/react-native-google-places-autocomplete/pull/970
- E/App issue: https://github.com/Expensify/App/issues/57511
- PR introducing patch: https://github.com/Expensify/App/pull/60421

### [react-native-google-places-autocomplete+2.5.6+002+keyboard-navigation.patch](react-native-google-places-autocomplete+2.5.6+002+keyboard-navigation.patch)

- Reason:

    ```
    This patch adds keyboard accessibility to autocomplete result rows.
    The row Pressable elements lacked tabIndex, making them unreachable
    via Tab key navigation. When tabbing from the text input, focus would
    leave the container, triggering onBlur which hid the list before any
    selection could occur. Adding tabIndex={0}, accessible, and an
    onKeyDown handler (Enter/Space) makes rows keyboard-focusable and
    selectable.
    ```

- E/App issue: https://github.com/Expensify/App/issues/79621