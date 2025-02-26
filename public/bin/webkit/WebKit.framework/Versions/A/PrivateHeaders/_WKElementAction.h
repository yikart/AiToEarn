/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#import <WebKit/WKFoundation.h>

#if TARGET_OS_IPHONE

#import <WebKit/_WKActivatedElementInfo.h>

@class UIAction;
@class UIImage;

typedef NSString *UIActionIdentifier;
WK_EXTERN UIActionIdentifier const WKElementActionTypeToggleShowLinkPreviewsIdentifier;

typedef void (^WKElementActionHandler)(_WKActivatedElementInfo *);
typedef BOOL (^WKElementActionDismissalHandler)(void);

typedef NS_ENUM(NSInteger, _WKElementActionType) {
    _WKElementActionTypeCustom,
    _WKElementActionTypeOpen,
    _WKElementActionTypeCopy,
    _WKElementActionTypeSaveImage,
#if TARGET_OS_IOS || (defined(TARGET_OS_VISION) && TARGET_OS_VISION)
    _WKElementActionTypeAddToReadingList,
    _WKElementActionTypeOpenInDefaultBrowser WK_API_AVAILABLE(ios(9.0)),
    _WKElementActionTypeOpenInExternalApplication WK_API_AVAILABLE(ios(9.0)),
#endif
    _WKElementActionTypeShare WK_API_AVAILABLE(macos(10.12), ios(10.0)),
    _WKElementActionTypeOpenInNewTab WK_API_AVAILABLE(macos(10.15), ios(13.0)),
    _WKElementActionTypeOpenInNewWindow WK_API_AVAILABLE(macos(10.15), ios(13.0)),
    _WKElementActionTypeDownload WK_API_AVAILABLE(macos(10.15), ios(13.0)),
    _WKElementActionToggleShowLinkPreviews WK_API_AVAILABLE(macos(10.15), ios(13.0)),
    _WKElementActionTypeImageExtraction WK_API_AVAILABLE(ios(15.0)),
    _WKElementActionTypeRevealImage WK_API_AVAILABLE(ios(15.0)),
    _WKElementActionTypeCopyCroppedImage WK_API_AVAILABLE(ios(16.0)),
#if defined(TARGET_OS_VISION) && TARGET_OS_VISION && __VISION_OS_VERSION_MIN_REQUIRED >= 20000
    _WKElementActionTypeViewSpatial WK_API_AVAILABLE(visionos(WK_XROS_TBA)),
#endif
    _WKElementActionPlayAnimation,
    _WKElementActionPauseAnimation,
} WK_API_AVAILABLE(macos(10.10), ios(8.0));

WK_CLASS_AVAILABLE(macos(10.10), ios(8.0))
@interface _WKElementAction : NSObject

+ (instancetype)elementActionWithType:(_WKElementActionType)type;
+ (instancetype)elementActionWithType:(_WKElementActionType)type title:(NSString *)title actionHandler:(WKElementActionHandler)actionHandler WK_API_AVAILABLE(macos(10.15), ios(13.0));
+ (instancetype)elementActionWithType:(_WKElementActionType)type customTitle:(NSString *)title;
+ (instancetype)elementActionWithTitle:(NSString *)title actionHandler:(WKElementActionHandler)handler;

+ (UIImage *)imageForElementActionType:(_WKElementActionType)actionType WK_API_AVAILABLE(macos(10.15), ios(13.0));
+ (_WKElementActionType)elementActionTypeForUIActionIdentifier:(UIActionIdentifier)identifier WK_API_AVAILABLE(macos(10.15), ios(13.0));
- (UIAction *)uiActionForElementInfo:(_WKActivatedElementInfo *)elementInfo;

- (void)runActionWithElementInfo:(_WKActivatedElementInfo *)info WK_API_AVAILABLE(macos(10.15), ios(9.0));

@property (nonatomic, readonly) _WKElementActionType type;
@property (nonatomic, readonly) NSString* title;
@property (nonatomic, readonly) BOOL disabled;
@property (nonatomic, copy) WKElementActionDismissalHandler dismissalHandler;

@end

#endif // TARGET_OS_IPHONE
