#import <UIKit/UIKit.h>
#import "RCTBridge.h"

extern NSString const *CALLBACK_ASSOCIATED_KEY;

@interface RCCNavigationController : UINavigationController

@property (copy, nonatomic) id navigatorEventID;

- (instancetype)initWithProps:(NSDictionary *)props children:(NSArray *)children globalProps:(NSDictionary*)globalProps bridge:(RCTBridge *)bridge;
- (void)performAction:(NSString*)performAction actionParams:(NSDictionary*)actionParams bridge:(RCTBridge *)bridge;
- (void)onPop;

@end
