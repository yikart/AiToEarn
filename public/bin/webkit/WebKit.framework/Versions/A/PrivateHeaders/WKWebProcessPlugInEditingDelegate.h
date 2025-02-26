/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#import <WebKit/WKWebProcessPlugInBrowserContextController.h>
#import <WebKit/WKWebProcessPlugInNodeHandle.h>
#import <WebKit/WKWebProcessPlugInRangeHandle.h>

#if TARGET_OS_IPHONE
#import <UIKit/UIKit.h>
#else
#import <AppKit/AppKit.h>
#endif

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, WKEditorInsertAction) {
    WKEditorInsertActionTyped,
    WKEditorInsertActionPasted,
    WKEditorInsertActionDropped,
} WK_API_AVAILABLE(macos(10.12.4), ios(10.3));

WK_API_AVAILABLE(macos(10.12.4), ios(10.3))
@protocol WKWebProcessPlugInEditingDelegate <NSObject>

@optional

- (BOOL)_webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller shouldInsertText:(NSString *)text replacingRange:(WKWebProcessPlugInRangeHandle *)range givenAction:(WKEditorInsertAction)action;
#if TARGET_OS_IPHONE
- (BOOL)_webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller shouldChangeSelectedRange:(WKDOMRange *)currentRange toRange:(WKDOMRange *)proposedRange affinity:(UITextStorageDirection)selectionAffinity stillSelecting:(BOOL)stillSelecting WK_API_AVAILABLE(ios(11.0));
#else
- (BOOL)_webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller shouldChangeSelectedRange:(WKDOMRange *)currentRange toRange:(WKDOMRange *)proposedRange affinity:(NSSelectionAffinity)selectionAffinity stillSelecting:(BOOL)stillSelecting WK_API_AVAILABLE(macos(10.13));
#endif
- (void)_webProcessPlugInBrowserContextControllerDidChangeByEditing:(WKWebProcessPlugInBrowserContextController *)controller;
- (void)_webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller willWriteRangeToPasteboard:(WKWebProcessPlugInRangeHandle *)range;
- (NSDictionary<NSString *, NSData *> *)_webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller pasteboardDataForRange:(WKWebProcessPlugInRangeHandle *)range;
- (void)_webProcessPlugInBrowserContextControllerDidWriteToPasteboard:(WKWebProcessPlugInBrowserContextController *)controller;
- (BOOL)_webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller performTwoStepDrop:(WKWebProcessPlugInNodeHandle *)fragment atDestination:(WKWebProcessPlugInRangeHandle *)destination isMove:(BOOL)isMove WK_API_AVAILABLE(macos(10.13), ios(11.0));

@end

NS_ASSUME_NONNULL_END
