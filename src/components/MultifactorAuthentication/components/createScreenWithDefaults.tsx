import React from 'react';

function createScreenWithDefaults<P extends Record<string, unknown>>(element: React.ReactElement<P, React.ComponentType<P>>, displayName: string): React.FC<Partial<P>> {
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
