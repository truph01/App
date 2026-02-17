#import "AppStartTime.h"

@implementation AppStartTime

static double appStartTime = 0;

+ (void)setAppStartTime:(double)timestamp {
    appStartTime = timestamp;
}

RCT_EXPORT_MODULE();

- (NSDictionary *)constantsToExport {
    return @{@"APP_START_TIME": @(appStartTime)};
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

@end
