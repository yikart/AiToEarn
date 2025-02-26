/*
 * Copyright (C) 2011 Apple Inc. All rights reserved.
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

#ifndef WebCoreThreadInternal_h
#define WebCoreThreadInternal_h

#include "WebCoreThread.h"

#if defined(__cplusplus)
extern "C" {
#endif    

// Sometimes, like for the Inspector, we need to pause the execution of a current run
// loop iteration and resume it later. This handles pushing and popping the autorelease
// pools to keep the original pool unaffected by the run loop observers. The
// WebThreadLock is released when calling Enable, and acquired when calling Disable.
// NOTE: Does not expect arbitrary nesting, only 1 level of nesting.
void WebRunLoopEnableNested();
void WebRunLoopDisableNested();

void WebThreadInitRunQueue();

WEBCORE_EXPORT CFRunLoopRef WebThreadRunLoop(void);
WebThreadContext *WebThreadCurrentContext(void);

#if defined(__cplusplus)
} // extern "C"
#endif

#endif // WebCoreThreadInternal_h
