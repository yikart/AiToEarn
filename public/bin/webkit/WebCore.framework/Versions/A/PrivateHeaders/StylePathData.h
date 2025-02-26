/*
 * Copyright (C) 2012 Adobe Systems Incorporated. All rights reserved.
 * Copyright (C) 2024 Samuel Weinig <sam@webkit.org>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer.
 * 2. Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials
 *    provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
 * OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
 * THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */

#pragma once

#include "StylePathFunction.h"
#include "WindRule.h"
#include <wtf/RefCounted.h>
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

// `StylePathData` is used to represent a path for the `d` property from SVG.
// https://svgwg.org/svg2-draft/paths.html#DProperty
class StylePathData final : public RefCounted<StylePathData> {
    WTF_MAKE_TZONE_ALLOCATED(StylePathData);
public:
    static Ref<StylePathData> create(Style::PathFunction path)
    {
        return adoptRef(*new StylePathData(WTFMove(path)));
    }

    ~StylePathData() = default;

    Ref<StylePathData> clone() const;

    const Style::PathFunction& path() const { return m_path; }

    Path path(const FloatRect&) const;
    WindRule windRule() const;

    bool canBlend(const StylePathData&) const;
    Ref<StylePathData> blend(const StylePathData&, const BlendingContext&) const;

    bool operator==(const StylePathData&) const;

private:
    StylePathData(Style::PathFunction&& path)
        : m_path { WTFMove(path) }
    {
    }

    Style::PathFunction m_path;
};

} // namespace WebCore
