/*
 * Copyright (C) 2022 Apple Inc.  All rights reserved.
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

#include "GraphicsContext.h"
#include <wtf/TZoneMallocInlines.h>

namespace WebCore {

class GraphicsContextStateSaver {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(GraphicsContextStateSaver);
public:
    GraphicsContextStateSaver(GraphicsContext& context, bool saveAndRestore = true)
        : m_context(context)
        , m_saveAndRestore(saveAndRestore)
    {
        if (m_saveAndRestore)
            m_context.save();
    }
    
    ~GraphicsContextStateSaver()
    {
        if (m_saveAndRestore)
            m_context.restore();
    }
    
    void save()
    {
        ASSERT(!m_saveAndRestore);
        m_context.save();
        m_saveAndRestore = true;
    }

    void restore()
    {
        ASSERT(m_saveAndRestore);
        m_context.restore();
        m_saveAndRestore = false;
    }
    
    GraphicsContext* context() const { return &m_context; }

private:
    GraphicsContext& m_context;
    bool m_saveAndRestore;
};

class TransparencyLayerScope {
public:
    TransparencyLayerScope(GraphicsContext& context, float alpha, bool beginLayer = true)
        : m_context(context)
        , m_alpha(alpha)
        , m_beganLayer(beginLayer)
    {
        if (beginLayer)
            m_context.beginTransparencyLayer(m_alpha);
    }
    
    void beginLayer(float alpha)
    {
        m_alpha = alpha;
        m_context.beginTransparencyLayer(m_alpha);
        m_beganLayer = true;
    }
    
    ~TransparencyLayerScope()
    {
        if (m_beganLayer)
            m_context.endTransparencyLayer();
    }

private:
    GraphicsContext& m_context;
    float m_alpha;
    bool m_beganLayer;
};

class GraphicsContextStateStackChecker {
public:
    GraphicsContextStateStackChecker(GraphicsContext& context)
        : m_context(context)
        , m_stackSize(context.stackSize())
    { }
    
    ~GraphicsContextStateStackChecker()
    {
        if (m_context.stackSize() != m_stackSize)
            WTFLogAlways("GraphicsContext %p stack changed by %d", &m_context, (int)m_context.stackSize() - (int)m_stackSize);
    }

private:
    GraphicsContext& m_context;
    unsigned m_stackSize;
};

class InterpolationQualityMaintainer {
public:
    explicit InterpolationQualityMaintainer(GraphicsContext& graphicsContext, InterpolationQuality interpolationQualityToUse)
        : m_graphicsContext(graphicsContext)
        , m_currentInterpolationQuality(graphicsContext.imageInterpolationQuality())
        , m_interpolationQualityChanged(interpolationQualityToUse != InterpolationQuality::Default && m_currentInterpolationQuality != interpolationQualityToUse)
    {
        if (m_interpolationQualityChanged)
            m_graphicsContext.setImageInterpolationQuality(interpolationQualityToUse);
    }

    explicit InterpolationQualityMaintainer(GraphicsContext& graphicsContext, std::optional<InterpolationQuality> interpolationQuality)
        : InterpolationQualityMaintainer(graphicsContext, interpolationQuality ? interpolationQuality.value() : graphicsContext.imageInterpolationQuality())
    {
    }

    ~InterpolationQualityMaintainer()
    {
        if (m_interpolationQualityChanged)
            m_graphicsContext.setImageInterpolationQuality(m_currentInterpolationQuality);
    }

private:
    GraphicsContext& m_graphicsContext;
    InterpolationQuality m_currentInterpolationQuality;
    bool m_interpolationQualityChanged;
};

} // namespace WebCore
