import type {ParamListBase, ScreenLayoutArgs} from '@react-navigation/native';
import type {StackNavigationOptions} from '@react-navigation/stack';
import {useLayoutEffect} from 'react';
import type {PlatformStackNavigationOptions, PlatformStackNavigationProp} from '@libs/Navigation/PlatformStackNavigation/types';
import TransitionTracker from '@libs/Navigation/TransitionTracker';

function InteractionManagerLayout({
    children,
    navigation,
    options,
    route,
}: ScreenLayoutArgs<ParamListBase, string, StackNavigationOptions | PlatformStackNavigationOptions, PlatformStackNavigationProp<ParamListBase>>) {
    useLayoutEffect(() => {
        const transitionStartListener = navigation.addListener('transitionStart', () => {
            console.log('xdd transitionStart', route?.name);
            TransitionTracker.startTransition('navigation');
        });
        const transitionEndListener = navigation.addListener('transitionEnd', () => {
            console.log('xdd transitionEnd', route?.name);
            TransitionTracker.endTransition('navigation');
        });

        return () => {
            transitionStartListener();
            transitionEndListener();
        };
    }, [navigation, options.animation, route?.name]);

    return children;
}

export default InteractionManagerLayout;
