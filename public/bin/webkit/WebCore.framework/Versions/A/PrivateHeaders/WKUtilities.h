/*
 * Copyright (C) 2005, 2006, 2007, 2009 Apple Inc. All rights reserved.
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

#ifndef WKUtilities_h
#define WKUtilities_h

#if TARGET_OS_IPHONE

#import "WKTypes.h"
#import <CoreGraphics/CoreGraphics.h>

#ifdef __cplusplus
extern "C" {
#endif

extern const CFArrayCallBacks WKCollectionArrayCallBacks;
extern const CFSetCallBacks WKCollectionSetCallBacks;


typedef void(*WKDeallocCallback)(WAKObjectRef object);

typedef struct _WKClassInfo WKClassInfo;

struct _WKClassInfo
{
    const WKClassInfo *parent;
    const char *name;
    WKDeallocCallback dealloc;
};

extern WKClassInfo WAKObjectClass;

struct _WAKObject
{
    unsigned referenceCount;
    WKClassInfo *classInfo;
};

const void *WKCreateObjectWithSize (size_t size, WKClassInfo *info);
// These functions use the WAK prefix to avoid breaking InstallAPI in Mac
// Catalyst: https://bugs.webkit.org/show_bug.cgi?id=257560
const void *WAKRetain(const void *object);
void WAKRelease(const void *object);

const void *WKCollectionRetain (CFAllocatorRef allocator, const void *value);
void WKCollectionRelease (CFAllocatorRef allocator, const void *value);

void WKReportError(const char *file, int line, const char *function, const char *format, ...);
#define WKError(formatAndArgs...) WKReportError(__FILE__, __LINE__, __PRETTY_FUNCTION__, formatAndArgs)

CFIndex WKArrayIndexOfValue (CFArrayRef array, const void *value);

WKClassInfo *WKGetClassInfo(WAKObjectRef);

#ifdef __cplusplus
}
#endif

#endif // TARGET_OS_IPHONE

#endif // WKUtilities_h
