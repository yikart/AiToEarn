/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#pragma once

#include "DragActions.h"
#include "DragData.h"
#include "DragItem.h"
#include "FloatPoint.h"
#include "IntPoint.h"
#include <wtf/TZoneMallocInlines.h>

namespace WebCore {
    
class DataTransfer;
class Element;
class Frame;
class Image;
class LocalFrame;

#if ENABLE(ATTACHMENT_ELEMENT)
struct PromisedAttachmentInfo;
#endif

class DragClient {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(DragClient);
public:
    virtual bool useLegacyDragClient() { return true; }

    virtual void willPerformDragDestinationAction(DragDestinationAction, const DragData&) = 0;
    virtual void willPerformDragSourceAction(DragSourceAction, const IntPoint&, DataTransfer&) = 0;
    virtual void didConcludeEditDrag() { }
    virtual OptionSet<DragSourceAction> dragSourceActionMaskForPoint(const IntPoint& rootViewPoint) = 0;
    
    virtual void startDrag(DragItem, DataTransfer&, Frame&) = 0;
    virtual void dragEnded() { }

    virtual void beginDrag(DragItem, LocalFrame&, const IntPoint&, const IntPoint&, DataTransfer&, DragSourceAction) { }

#if PLATFORM(COCOA)
    // Mac-specific helper function to allow access to web archives and NSPasteboard extras in WebKit.
    // This is not abstract as that would require another #if PLATFORM(COCOA) for the SVGImage client empty implentation.
    virtual void declareAndWriteDragImage(const String&, Element&, const URL&, const String&, LocalFrame*) { }
#endif

    virtual ~DragClient() = default;
};
    
} // namespace WebCore
