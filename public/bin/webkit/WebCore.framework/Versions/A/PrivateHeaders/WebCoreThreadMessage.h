/*
 * Copyright (C) 2006, 2007, 2008, 2009 Apple Inc. All rights reserved.
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

#ifndef WebCoreThreadMessage_h
#define WebCoreThreadMessage_h

#if TARGET_OS_IPHONE

#import <Foundation/Foundation.h>

#ifdef __OBJC__
#import <WebCore/WebCoreThread.h>
#endif // __OBJC__

#if defined(__cplusplus)
extern "C" {
#endif    

//
// Release an object on the main thread.
//
@interface NSObject(WebCoreThreadAdditions)
- (void)releaseOnMainThread;
@end

// Register a class for deallocation on the WebThread
WEBCORE_EXPORT void WebCoreObjCDeallocOnWebThread(Class cls);

// Asynchronous from main thread to web thread.
WEBCORE_EXPORT void WebThreadAdoptAndRelease(id obj);

// Synchronous from web thread to main thread, or main thread to main thread.
WEBCORE_EXPORT void WebThreadCallDelegate(NSInvocation *invocation);
WEBCORE_EXPORT void WebThreadRunOnMainThread(void (^)(void));

// Asynchronous from web thread to main thread, but synchronous when called on the main thread.
WEBCORE_EXPORT void WebThreadCallDelegateAsync(NSInvocation *invocation);

// Asynchronous from web thread to main thread, but synchronous when called on the main thread.
WEBCORE_EXPORT void WebThreadPostNotification(NSString *name, id object, id userInfo);

// Convenience method for making an NSInvocation object
WEBCORE_EXPORT NSInvocation *WebThreadMakeNSInvocation(id target, SEL selector);

#if defined(__cplusplus)
}
#endif

#endif // TARGET_OS_IPHONE

#endif // WebCoreThreadMessage_h
