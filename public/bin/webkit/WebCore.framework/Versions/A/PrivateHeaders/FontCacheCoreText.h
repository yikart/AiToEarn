/*
 * Copyright (C) 2017-2023 Apple Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "FontDescription.h"
#include "ShouldLocalizeAxisNames.h"

#include <CoreText/CTFont.h>

namespace WebCore {

class FontCreationContext;
class UnrealizedCoreTextFont;
enum class FontLookupOptions : uint8_t;

struct SynthesisPair {
    explicit SynthesisPair(bool needsSyntheticBold, bool needsSyntheticOblique)
        : needsSyntheticBold(needsSyntheticBold)
        , needsSyntheticOblique(needsSyntheticOblique)
    {
    }

    std::pair<bool, bool> boldObliquePair() const
    {
        return std::make_pair(needsSyntheticBold, needsSyntheticOblique);
    }

    bool needsSyntheticBold;
    bool needsSyntheticOblique;
};

struct VariationDefaults {
    String axisName;
    float defaultValue;
    float minimumValue;
    float maximumValue;

    bool contains(float value) const
    {
        ASSERT(minimumValue <= maximumValue);
        return value >= minimumValue && value <= maximumValue;
    }

    float clamp(float value) const
    {
        ASSERT(minimumValue <= maximumValue);
        return std::clamp(value, minimumValue, maximumValue);
    }
};

typedef UncheckedKeyHashMap<FontTag, VariationDefaults, FourCharacterTagHash, FourCharacterTagHashTraits> VariationDefaultsMap;

enum class FontTypeForPreparation : bool {
    SystemFont,
    NonSystemFont
};
enum class ApplyTraitsVariations : bool { No, Yes };
RetainPtr<CTFontRef> preparePlatformFont(UnrealizedCoreTextFont&&, const FontDescription&, const FontCreationContext&, FontTypeForPreparation = FontTypeForPreparation::NonSystemFont, ApplyTraitsVariations = ApplyTraitsVariations::Yes);
enum class ShouldComputePhysicalTraits : bool { No, Yes };
SynthesisPair computeNecessarySynthesis(CTFontRef, const FontDescription&, OptionSet<FontLookupOptions> = { }, ShouldComputePhysicalTraits = ShouldComputePhysicalTraits::No, bool isPlatformFont = false);
RetainPtr<CTFontRef> platformFontWithFamily(const AtomString& family, FontSelectionRequest, TextRenderingMode, float size, OptionSet<FontLookupOptions>);
FontSelectionCapabilities capabilitiesForFontDescriptor(CTFontDescriptorRef);
void addAttributesForInstalledFonts(CFMutableDictionaryRef attributes, AllowUserInstalledFonts);
RetainPtr<CTFontRef> createFontForInstalledFonts(CTFontDescriptorRef, CGFloat size, AllowUserInstalledFonts);
RetainPtr<CTFontRef> createFontForInstalledFonts(CTFontRef, AllowUserInstalledFonts);
void addAttributesForWebFonts(CFMutableDictionaryRef attributes, AllowUserInstalledFonts);
RetainPtr<CFSetRef> installedFontMandatoryAttributes(AllowUserInstalledFonts);
WEBCORE_EXPORT void setOverrideEnhanceTextLegibility(bool);
bool fontNameIsSystemFont(CFStringRef);

CFStringRef getUIContentSizeCategoryDidChangeNotificationName();
WEBCORE_EXPORT void setContentSizeCategory(const String&);
WEBCORE_EXPORT CFStringRef contentSizeCategory();

VariationDefaultsMap defaultVariationValues(CTFontRef, ShouldLocalizeAxisNames);

} // namespace WebCore
