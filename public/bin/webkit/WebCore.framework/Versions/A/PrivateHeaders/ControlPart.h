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

#include "Color.h"
#include "ControlFactory.h"
#include "PlatformControl.h"
#include "StyleAppearance.h"
#include <wtf/ThreadSafeRefCounted.h>

namespace WebCore {

class FloatRect;
class GraphicsContext;
class ControlFactory;

class ControlPart : public ThreadSafeRefCounted<ControlPart> {
public:
    virtual ~ControlPart() = default;

    StyleAppearance type() const { return m_type; }

    WEBCORE_EXPORT ControlFactory& controlFactory() const;
    void setOverrideControlFactory(RefPtr<ControlFactory>&& controlFactory) { m_overrideControlFactory = WTFMove(controlFactory); }

    FloatSize sizeForBounds(const FloatRect& bounds, const ControlStyle&);
    FloatRect rectForBounds(const FloatRect& bounds, const ControlStyle&);
    void draw(GraphicsContext&, const FloatRoundedRect& borderRect, float deviceScaleFactor, const ControlStyle&) const;

protected:
    WEBCORE_EXPORT ControlPart(StyleAppearance);

    PlatformControl* platformControl() const;
    virtual std::unique_ptr<PlatformControl> createPlatformControl() = 0;

    const StyleAppearance m_type;

    mutable std::unique_ptr<PlatformControl> m_platformControl;
    RefPtr<ControlFactory> m_controlFactory;
    RefPtr<ControlFactory> m_overrideControlFactory;
};

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_CONTROL_PART(PartName) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::PartName##Part) \
    static bool isType(const WebCore::ControlPart& part) { return part.type() == WebCore::StyleAppearance::PartName; } \
SPECIALIZE_TYPE_TRAITS_END()
