import type {ParamListBase, ScreenLayoutArgs} from '@react-navigation/native';
import type {StackNavigationOptions, StackNavigationProp} from '@react-navigation/stack';
import {useLayoutEffect} from 'react';
import TransitionTracker from '@libs/Navigation/TransitionTracker';
import type {PlatformStackNavigationOptions} from './types';

function ScreenLayout({children, navigation: navigationProp, options, route}: ScreenLayoutArgs<ParamListBase, string, StackNavigationOptions | PlatformStackNavigationOptions, string>) {
    // useNavigationBuilder hardcodes the Navigation generic to `string`, but the actual runtime value is a full navigation object.
    const navigation = navigationProp as unknown as StackNavigationProp<ParamListBase>;

    useLayoutEffect(() => {
        const transitionStartListener = navigation.addListener('transitionStart', () => {
            TransitionTracker.startTransition();
        });
        const transitionEndListener = navigation.addListener('transitionEnd', () => {
            TransitionTracker.endTransition();
        });

        return () => {
            transitionStartListener();
            transitionEndListener();
        };
    }, [navigation, options.animation, route?.name]);

    return children;
}

export default ScreenLayout;
