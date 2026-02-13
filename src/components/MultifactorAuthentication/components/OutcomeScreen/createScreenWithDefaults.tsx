import React from 'react';

/**
 * Creates a new component from a JSX element, extracting its props as defaults.
 * The returned component accepts `Partial<P>` — any prop passed at usage site
 * overrides the corresponding default, while omitted props keep their defaults.
 *
 * This enables a layered customization pattern where a base screen (e.g. FailureScreenBase)
 * is wrapped once with full defaults, and consumers can selectively override individual props
 * without redefining the entire element.
 *
 * @param element - A JSX element whose component type and props become the defaults.
 * @param displayName - Display name assigned to the returned component for debugging.
 * @returns A component that renders the original component with merged props (defaults + overrides).
 *
 * @example
 * // Define a screen with all defaults baked in:
 * const DefaultClientFailureScreen = createScreenWithDefaults<FailureScreenBaseProps>(
 *     <FailureScreenBase
 *         illustration="MagnifyingGlass"
 *         title="multifactorAuthentication.oops"
 *         subtitle="multifactorAuthentication.yourAttemptWasUnsuccessful"
 *     />,
 *     'DefaultClientFailureScreen',
 * );
 *
 * // Use as-is (all defaults apply):
 * <DefaultClientFailureScreen />
 *
 * // Override only the title (illustration and subtitle keep their defaults):
 * <DefaultClientFailureScreen title="multifactorAuthentication.customTitle" />
 */
function createScreenWithDefaults<P extends Record<string, unknown>>(element: React.ReactElement<P>, displayName: string): React.FC<Partial<P>> {
    const {type: Component, props: defaultProps} = element;

    function Screen(overrideProps: Partial<P>) {
        const mergedProps: P = {...defaultProps, ...overrideProps};

        // eslint-disable-next-line react/jsx-props-no-spreading
        return <Component {...mergedProps} />;
    }

    Screen.displayName = displayName;

    return Screen;
}

export default createScreenWithDefaults;
