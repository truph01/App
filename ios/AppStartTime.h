#ifndef AppStartTime_h
#define AppStartTime_h

#import <React/RCTBridgeModule.h>

@interface AppStartTime : NSObject <RCTBridgeModule>
+ (void)setAppStartTime:(double)timestamp;
@end

#endif /* AppStartTime_h */
