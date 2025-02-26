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

#ifndef WebCoreThread_h
#define WebCoreThread_h

#if TARGET_OS_IPHONE

#import <CoreGraphics/CoreGraphics.h>

// Use __has_include here so that things work when rewritten into WebKitLegacy headers.
#if __has_include(<WebCore/PlatformExportMacros.h>)
#import <WebCore/PlatformExportMacros.h>
#endif

#if defined(__cplusplus)
extern "C" {
#endif    
        
typedef struct {
    CGContextRef currentCGContext;
} WebThreadContext;
    
extern volatile bool webThreadShouldYield;
extern volatile unsigned webThreadDelegateMessageScopeCount;

#ifdef __OBJC__
@class NSRunLoop;
#else
class NSRunLoop;
#endif

// The lock is automatically freed at the bottom of the runloop. No need to unlock.
// Note that calling this function may hang your UI for several seconds. Don't use
// unless you have to.
WEBCORE_EXPORT void WebThreadLock(void);
    
// This is a no-op for compatibility only. It will go away. Please don't use.
WEBCORE_EXPORT void WebThreadUnlock(void);
    
// Please don't use anything below this line unless you know what you are doing. If unsure, ask.
// ---------------------------------------------------------------------------------------------
WEBCORE_EXPORT bool WebThreadIsLocked(void);
WEBCORE_EXPORT bool WebThreadIsLockedOrDisabled(void);
WEBCORE_EXPORT bool WebThreadIsLockedOrDisabledInMainOrWebThread(void);

WEBCORE_EXPORT void WebThreadLockPushModal(void);
WEBCORE_EXPORT void WebThreadLockPopModal(void);

WEBCORE_EXPORT void WebThreadEnable(void);
WEBCORE_EXPORT bool WebThreadIsEnabled(void);
WEBCORE_EXPORT bool WebThreadIsCurrent(void);
WEBCORE_EXPORT bool WebThreadNotCurrent(void);
    
// These are for <rdar://problem/6817341> Many apps crashing calling -[UIFieldEditor text] in secondary thread
// Don't use them to solve any random problems you might have.
WEBCORE_EXPORT void WebThreadLockFromAnyThread(void);
WEBCORE_EXPORT void WebThreadLockFromAnyThreadNoLog(void);
WEBCORE_EXPORT void WebThreadUnlockFromAnyThread(void);

// This is for <rdar://problem/8005192> Mail entered a state where message subject and content isn't displayed.
// It should only be used for MobileMail to work around <rdar://problem/8005192>.
WEBCORE_EXPORT void WebThreadUnlockGuardForMail(void);

static inline bool WebThreadShouldYield(void) { return webThreadShouldYield; }
static inline void WebThreadSetShouldYield(void) { webThreadShouldYield = true; }

WEBCORE_EXPORT NSRunLoop* WebThreadNSRunLoop(void);

#if defined(__cplusplus)
}
#endif

#endif // TARGET_OS_IPHONE

#endif // WebCoreThread_h
