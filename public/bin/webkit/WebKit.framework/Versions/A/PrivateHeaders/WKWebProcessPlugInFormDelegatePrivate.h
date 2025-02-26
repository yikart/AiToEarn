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

#import <WebKit/WKWebProcessPlugInBrowserContextController.h>
#import <WebKit/WKWebProcessPlugInFrame.h>
#import <WebKit/WKWebProcessPlugInNodeHandle.h>

@protocol WKWebProcessPlugInFormDelegatePrivate <NSObject>

@optional

- (void)_webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller didFocusTextField:(WKWebProcessPlugInNodeHandle *)textField inFrame:(WKWebProcessPlugInFrame *)frame;
- (void)_webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller willSendSubmitEventToForm:(WKWebProcessPlugInNodeHandle *)form inFrame:(WKWebProcessPlugInFrame *)sourceFrame targetFrame:(WKWebProcessPlugInFrame *)targetFrame values:(NSDictionary *)values;
- (void)_webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller textDidChangeInTextField:(WKWebProcessPlugInNodeHandle *)textField inFrame:(WKWebProcessPlugInFrame *)frame initiatedByUserTyping:(BOOL)initiatedByUserTyping;

// The return value is exposed in the UI process via the userObject parameter to -[id <_WKInputDelegate> _webView:willSubmitFormValues:userObject:submissionHandler:].
- (NSObject <NSSecureCoding> *)_webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller willSubmitForm:(WKWebProcessPlugInNodeHandle *)form toFrame:(WKWebProcessPlugInFrame *)frame fromFrame:(WKWebProcessPlugInFrame *)sourceFrame withValues:(NSDictionary *)values;

// The return value is exposed in the UI process via the userObject property of the _WKFormInputSession object.
- (NSObject <NSSecureCoding> *)_webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller willBeginInputSessionForElement:(WKWebProcessPlugInNodeHandle *)node inFrame:(WKWebProcessPlugInFrame *)frame;
- (NSObject <NSSecureCoding> *)_webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller willBeginInputSessionForElement:(WKWebProcessPlugInNodeHandle *)node inFrame:(WKWebProcessPlugInFrame *)frame userIsInteracting:(BOOL)userIsInteracting WK_API_AVAILABLE(ios(10.0));

- (BOOL)_webProcessPlugInBrowserContextControllerShouldNotifyOnFormChanges:(WKWebProcessPlugInBrowserContextController *)controller;
- (void)_webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller didAssociateFormControls:(NSArray *)elements;

@end
