/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#include "FontFeatureValues.h"
#include "FontPaletteValues.h"
#include "FontSelectionAlgorithm.h"
#include "FontTaggedSettings.h"
#include <wtf/PointerComparison.h>

namespace WebCore {

class FontCreationContextRareData : public RefCounted<FontCreationContextRareData> {
public:
    static Ref<FontCreationContextRareData> create(const FontFeatureSettings& fontFaceFeatures, const FontPaletteValues& fontPaletteValues, RefPtr<FontFeatureValues> fontFeatureValues, float sizeAdjust)
    {
        return adoptRef(*new FontCreationContextRareData(fontFaceFeatures, fontPaletteValues, fontFeatureValues, sizeAdjust));
    }

    const FontFeatureSettings& fontFaceFeatures() const
    {
        return m_fontFaceFeatures;
    }

    float sizeAdjust() const
    {
        return m_sizeAdjust;
    }

    const FontPaletteValues& fontPaletteValues() const
    {
        return m_fontPaletteValues;
    }

    RefPtr<FontFeatureValues> fontFeatureValues() const
    {
        return m_fontFeatureValues;
    }

    bool operator==(const FontCreationContextRareData& other) const
    {
        return m_fontFaceFeatures == other.m_fontFaceFeatures
            && m_fontPaletteValues == other.m_fontPaletteValues
            && m_fontFeatureValues.get() == other.m_fontFeatureValues.get()
            && m_sizeAdjust == other.m_sizeAdjust;
    }

private:
    FontCreationContextRareData(const FontFeatureSettings& fontFaceFeatures, const FontPaletteValues& fontPaletteValues, RefPtr<FontFeatureValues> fontFeatureValues, float sizeAdjust)
        : m_fontFaceFeatures(fontFaceFeatures)
        , m_fontPaletteValues(fontPaletteValues)
        , m_fontFeatureValues(fontFeatureValues)
        , m_sizeAdjust(sizeAdjust)
    {
    }

    FontFeatureSettings m_fontFaceFeatures;
    FontPaletteValues m_fontPaletteValues;
    RefPtr<FontFeatureValues> m_fontFeatureValues;
    float m_sizeAdjust;
};

class FontCreationContext {
public:
    FontCreationContext() = default;

    FontCreationContext(const FontFeatureSettings& fontFaceFeatures, const FontSelectionSpecifiedCapabilities& fontFaceCapabilities, const FontPaletteValues& fontPaletteValues, RefPtr<FontFeatureValues> fontFeatureValues, float sizeAdjust)
        : m_fontFaceCapabilities(fontFaceCapabilities)
    {
        if (!fontFaceFeatures.isEmpty() || fontPaletteValues || (fontFeatureValues && !fontFeatureValues->isEmpty()) || sizeAdjust != 1.0)
            m_rareData = FontCreationContextRareData::create(fontFaceFeatures, fontPaletteValues, fontFeatureValues, sizeAdjust);
    }

    const FontFeatureSettings* fontFaceFeatures() const
    {
        return m_rareData ? &m_rareData->fontFaceFeatures() : nullptr;
    }

    float sizeAdjust() const
    {
        return m_rareData ? m_rareData->sizeAdjust() : 1.0;
    }

    const FontSelectionSpecifiedCapabilities& fontFaceCapabilities() const
    {
        return m_fontFaceCapabilities;
    }

    const FontPaletteValues* fontPaletteValues() const
    {
        return m_rareData ? &m_rareData->fontPaletteValues() : nullptr;
    }

    RefPtr<FontFeatureValues> fontFeatureValues() const
    {
        return m_rareData ? m_rareData->fontFeatureValues() : nullptr;
    }

    bool operator==(const FontCreationContext& other) const
    {
        return m_fontFaceCapabilities == other.m_fontFaceCapabilities
            && arePointingToEqualData(m_rareData, other.m_rareData);
    }

private:
    FontSelectionSpecifiedCapabilities m_fontFaceCapabilities;
    RefPtr<FontCreationContextRareData> m_rareData;
};

inline void add(Hasher& hasher, const FontCreationContext& fontCreationContext)
{
    if (fontCreationContext.fontFaceFeatures())
        add(hasher, *fontCreationContext.fontFaceFeatures());
    add(hasher, fontCreationContext.fontFaceCapabilities());
    if (fontCreationContext.fontPaletteValues())
        add(hasher, *fontCreationContext.fontPaletteValues());
    if (fontCreationContext.fontFeatureValues())
        add(hasher, *fontCreationContext.fontFeatureValues());
    if (fontCreationContext.sizeAdjust())
        add(hasher, fontCreationContext.sizeAdjust());
}

}
