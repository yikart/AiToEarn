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

#pragma once

#include "AffineTransform.h"
#include "IntRect.h"
#include <wtf/CheckedPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

namespace WebCore {

class Path;

class RegionContext : public CanMakeCheckedPtr<RegionContext> {
    WTF_MAKE_TZONE_ALLOCATED(RegionContext);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(RegionContext);
public:
    virtual ~RegionContext() = default;

    void pushTransform(const AffineTransform&);
    void popTransform();

    void pushClip(const IntRect&);
    void pushClip(const Path&);
    void popClip();

    virtual bool isEventRegionContext() const { return false; }
    virtual bool isAccessibilityRegionContext() const { return false; }

protected:
    Vector<AffineTransform> m_transformStack;
    Vector<IntRect> m_clipStack;

}; // class RegionContext

class RegionContextStateSaver {
public:
    RegionContextStateSaver(RegionContext* context)
        : m_context(context)
    {
    }

    ~RegionContextStateSaver()
    {
        if (!m_context)
            return;

        if (m_pushedClip)
            m_context->popClip();
    }

    void pushClip(const IntRect& clipRect)
    {
        ASSERT(!m_pushedClip);
        if (m_context)
            m_context->pushClip(clipRect);
        m_pushedClip = true;
    }

    void pushClip(const Path& path)
    {
        ASSERT(!m_pushedClip);
        if (m_context)
            m_context->pushClip(path);
        m_pushedClip = true;
    }

    RegionContext* context() const { return const_cast<RegionContext*>(m_context.get()); }

private:
    CheckedPtr<RegionContext> m_context;
    bool m_pushedClip { false };
}; // class RegionContextStateSaver

} // namespace WebCore
