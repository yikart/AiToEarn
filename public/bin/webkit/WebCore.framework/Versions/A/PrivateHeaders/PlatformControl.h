/*
 * Copyright (C) 2022 Apple Inc. All Rights Reserved.
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

#include "ControlStyle.h"
#include "FloatRect.h"
#include <wtf/TZoneMallocInlines.h>

namespace WebCore {

class ControlPart;
class GraphicsContext;
class FloatRect;
class FloatRoundedRect;

class PlatformControl {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(PlatformControl);

public:
    PlatformControl(ControlPart& owningPart)
        : m_owningPart(owningPart)
    {
    }

    virtual ~PlatformControl() = default;

    virtual void setFocusRingClipRect(const FloatRect&) { }

    virtual void updateCellStates(const FloatRect&, const ControlStyle&) { }

    virtual FloatSize sizeForBounds(const FloatRect& bounds, const ControlStyle&) const { return bounds.size(); }

    virtual FloatRect rectForBounds(const FloatRect& bounds, const ControlStyle&) const { return bounds; }

    virtual void draw(GraphicsContext&, const FloatRoundedRect&, float, const ControlStyle&) { }

protected:
    ControlPart& m_owningPart;
};

} // namespace WebCore
