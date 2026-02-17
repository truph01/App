import type {ParamListBase, ScreenLayoutArgs} from '@react-navigation/native';
import type {StackNavigationOptions} from '@react-navigation/stack';
import {useLayoutEffect} from 'react';
import TransitionTracker from '@libs/Navigation/TransitionTracker';
import type {PlatformStackNavigationOptions, PlatformStackNavigationProp} from './types';

function ScreenLayout({
    children,
    navigation,
    options,
    route,
}: ScreenLayoutArgs<ParamListBase, string, StackNavigationOptions | PlatformStackNavigationOptions, PlatformStackNavigationProp<ParamListBase>>) {
    useLayoutEffect(() => {
        const transitionStartListener = navigation.addListener('transitionStart', () => {
            TransitionTracker.startTransition('navigation');
        });
        const transitionEndListener = navigation.addListener('transitionEnd', () => {
            TransitionTracker.endTransition('navigation');
        });

        return () => {
            transitionStartListener();
            transitionEndListener();
        };
    }, [navigation, options.animation, route?.name]);

    return children;
}

export default ScreenLayout;
