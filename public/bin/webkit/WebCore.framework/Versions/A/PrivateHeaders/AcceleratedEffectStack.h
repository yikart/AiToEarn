/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#if ENABLE(THREADED_ANIMATION_RESOLUTION)

#include "AcceleratedEffect.h"
#include "AcceleratedEffectValues.h"

namespace WebCore {

using AcceleratedEffects = Vector<Ref<AcceleratedEffect>>;

class WEBCORE_EXPORT AcceleratedEffectStack : public RefCounted<AcceleratedEffectStack> {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED_EXPORT(AcceleratedEffectStack, WEBCORE_EXPORT);
public:
    static Ref<AcceleratedEffectStack> create();

    bool hasEffects() const;
    const AcceleratedEffects& primaryLayerEffects() const { return m_primaryLayerEffects; }
    const AcceleratedEffects& backdropLayerEffects() const { return m_backdropLayerEffects; }
    virtual void setEffects(AcceleratedEffects&&);

    const AcceleratedEffectValues& baseValues() { return m_baseValues; }
    void setBaseValues(AcceleratedEffectValues&&);

    virtual ~AcceleratedEffectStack() = default;

protected:
    WEBCORE_EXPORT explicit AcceleratedEffectStack();

    AcceleratedEffectValues m_baseValues;
    AcceleratedEffects m_primaryLayerEffects;
    AcceleratedEffects m_backdropLayerEffects;
};

} // namespace WebCore

#endif // ENABLE(THREADED_ANIMATION_RESOLUTION)
