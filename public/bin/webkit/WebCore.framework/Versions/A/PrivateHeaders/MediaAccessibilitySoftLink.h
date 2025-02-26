/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef MediaAccessibilitySoftLink_h
#define MediaAccessibilitySoftLink_h

#if HAVE(MEDIA_ACCESSIBILITY_FRAMEWORK)

#include <CoreText/CoreText.h>
#include <MediaAccessibility/MediaAccessibility.h>
#include <pal/spi/cf/MediaAccessibilitySPI.h>
#include <wtf/SoftLinking.h>

#if COMPILER(MSVC)
#pragma warning(push)
#pragma warning(disable:4273)
#endif

SOFT_LINK_FRAMEWORK_FOR_HEADER(WebCore, MediaAccessibility)

SOFT_LINK_FUNCTION_FOR_HEADER(WebCore, MediaAccessibility, MACaptionAppearanceGetDisplayType, MACaptionAppearanceDisplayType, (MACaptionAppearanceDomain domain), (domain))
#define MACaptionAppearanceGetDisplayType softLink_MediaAccessibility_MACaptionAppearanceGetDisplayType
SOFT_LINK_FUNCTION_FOR_HEADER(WebCore, MediaAccessibility, MACaptionAppearanceSetDisplayType, void, (MACaptionAppearanceDomain domain, MACaptionAppearanceDisplayType displayType), (domain, displayType))
#define MACaptionAppearanceSetDisplayType softLink_MediaAccessibility_MACaptionAppearanceSetDisplayType
SOFT_LINK_FUNCTION_FOR_HEADER(WebCore, MediaAccessibility, MACaptionAppearanceCopyForegroundColor, CGColorRef, (MACaptionAppearanceDomain domain, MACaptionAppearanceBehavior *behavior), (domain, behavior))
#define MACaptionAppearanceCopyForegroundColor softLink_MediaAccessibility_MACaptionAppearanceCopyForegroundColor
SOFT_LINK_FUNCTION_FOR_HEADER(WebCore, MediaAccessibility, MACaptionAppearanceCopyBackgroundColor, CGColorRef, (MACaptionAppearanceDomain domain, MACaptionAppearanceBehavior *behavior), (domain, behavior))
#define MACaptionAppearanceCopyBackgroundColor softLink_MediaAccessibility_MACaptionAppearanceCopyBackgroundColor
SOFT_LINK_FUNCTION_FOR_HEADER(WebCore, MediaAccessibility, MACaptionAppearanceCopyWindowColor, CGColorRef, (MACaptionAppearanceDomain domain, MACaptionAppearanceBehavior *behavior), (domain, behavior))
#define MACaptionAppearanceCopyWindowColor softLink_MediaAccessibility_MACaptionAppearanceCopyWindowColor
SOFT_LINK_FUNCTION_FOR_HEADER(WebCore, MediaAccessibility, MACaptionAppearanceGetForegroundOpacity, CGFloat, (MACaptionAppearanceDomain domain, MACaptionAppearanceBehavior *behavior), (domain, behavior))
#define MACaptionAppearanceGetForegroundOpacity softLink_MediaAccessibility_MACaptionAppearanceGetForegroundOpacity
SOFT_LINK_FUNCTION_FOR_HEADER(WebCore, MediaAccessibility, MACaptionAppearanceGetBackgroundOpacity, CGFloat, (MACaptionAppearanceDomain domain, MACaptionAppearanceBehavior *behavior), (domain, behavior))
#define MACaptionAppearanceGetBackgroundOpacity softLink_MediaAccessibility_MACaptionAppearanceGetBackgroundOpacity
SOFT_LINK_FUNCTION_FOR_HEADER(WebCore, MediaAccessibility, MACaptionAppearanceGetWindowOpacity, CGFloat, (MACaptionAppearanceDomain domain, MACaptionAppearanceBehavior *behavior), (domain, behavior))
#define MACaptionAppearanceGetWindowOpacity softLink_MediaAccessibility_MACaptionAppearanceGetWindowOpacity
SOFT_LINK_FUNCTION_FOR_HEADER(WebCore, MediaAccessibility, MACaptionAppearanceGetWindowRoundedCornerRadius, CGFloat, (MACaptionAppearanceDomain domain, MACaptionAppearanceBehavior *behavior), (domain, behavior))
#define MACaptionAppearanceGetWindowRoundedCornerRadius softLink_MediaAccessibility_MACaptionAppearanceGetWindowRoundedCornerRadius
SOFT_LINK_FUNCTION_FOR_HEADER(WebCore, MediaAccessibility, MACaptionAppearanceCopyFontDescriptorForStyle, CTFontDescriptorRef, (MACaptionAppearanceDomain domain,  MACaptionAppearanceBehavior *behavior, MACaptionAppearanceFontStyle fontStyle), (domain, behavior, fontStyle))
#define MACaptionAppearanceCopyFontDescriptorForStyle softLink_MediaAccessibility_MACaptionAppearanceCopyFontDescriptorForStyle
SOFT_LINK_FUNCTION_FOR_HEADER(WebCore, MediaAccessibility, MACaptionAppearanceGetRelativeCharacterSize, CGFloat, (MACaptionAppearanceDomain domain, MACaptionAppearanceBehavior *behavior), (domain, behavior))
#define MACaptionAppearanceGetRelativeCharacterSize softLink_MediaAccessibility_MACaptionAppearanceGetRelativeCharacterSize
SOFT_LINK_FUNCTION_FOR_HEADER(WebCore, MediaAccessibility, MACaptionAppearanceGetTextEdgeStyle, MACaptionAppearanceTextEdgeStyle, (MACaptionAppearanceDomain domain, MACaptionAppearanceBehavior *behavior), (domain, behavior))
#define MACaptionAppearanceGetTextEdgeStyle softLink_MediaAccessibility_MACaptionAppearanceGetTextEdgeStyle
SOFT_LINK_FUNCTION_FOR_HEADER(WebCore, MediaAccessibility, MACaptionAppearanceAddSelectedLanguage, bool, (MACaptionAppearanceDomain domain, CFStringRef language), (domain, language));
#define MACaptionAppearanceAddSelectedLanguage softLink_MediaAccessibility_MACaptionAppearanceAddSelectedLanguage
SOFT_LINK_FUNCTION_FOR_HEADER(WebCore, MediaAccessibility, MACaptionAppearanceCopySelectedLanguages, CFArrayRef, (MACaptionAppearanceDomain domain), (domain));
#define MACaptionAppearanceCopySelectedLanguages softLink_MediaAccessibility_MACaptionAppearanceCopySelectedLanguages
SOFT_LINK_FUNCTION_FOR_HEADER(WebCore, MediaAccessibility, MACaptionAppearanceCopyPreferredCaptioningMediaCharacteristics,  CFArrayRef, (MACaptionAppearanceDomain domain), (domain));
#define MACaptionAppearanceCopyPreferredCaptioningMediaCharacteristics softLink_MediaAccessibility_MACaptionAppearanceCopyPreferredCaptioningMediaCharacteristics
SOFT_LINK_FUNCTION_MAY_FAIL_FOR_HEADER(WebCore, MediaAccessibility, MAAudibleMediaCopyPreferredCharacteristics, CFArrayRef, (), ())
#define MAAudibleMediaCopyPreferredCharacteristics softLink_MediaAccessibility_MAAudibleMediaCopyPreferredCharacteristics
SOFT_LINK_FUNCTION_MAY_FAIL_FOR_HEADER(WebCore, MediaAccessibility, MACaptionAppearanceCopyFontDescriptorWithStrokeForStyle, CTFontDescriptorRef, (MACaptionAppearanceDomain domain, MACaptionAppearanceBehavior *behavior, MACaptionAppearanceFontStyle fontStyle, CFStringRef trackLanguage, CGFloat darwingPointSize, CGFloat *strokeWidthPt), (domain, behavior, fontStyle, trackLanguage, darwingPointSize, strokeWidthPt))
#define MACaptionAppearanceCopyFontDescriptorWithStrokeForStyle softLink_MediaAccessibility_MACaptionAppearanceCopyFontDescriptorWithStrokeForStyle
SOFT_LINK_CONSTANT_FOR_HEADER(WebCore, MediaAccessibility, kMAXCaptionAppearanceSettingsChangedNotification, CFStringRef)
#define kMAXCaptionAppearanceSettingsChangedNotification get_MediaAccessibility_kMAXCaptionAppearanceSettingsChangedNotification()
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, MediaAccessibility, kMAAudibleMediaSettingsChangedNotification, CFStringRef)
#define kMAAudibleMediaSettingsChangedNotification get_MediaAccessibility_kMAAudibleMediaSettingsChangedNotification()
SOFT_LINK_FUNCTION_MAY_FAIL_FOR_HEADER(WebCore, MediaAccessibility, MAImageCaptioningCopyCaptionWithSource, CFStringRef, (CGImageSourceRef imageSource, CFErrorRef * CF_RETURNS_RETAINED error), (imageSource, error))
#define MAImageCaptioningCopyCaptionWithSource softLink_MediaAccessibility_MAImageCaptioningCopyCaptionWithSource
SOFT_LINK_FUNCTION_FOR_HEADER(WebCore, MediaAccessibility, MAAudibleMediaPrefCopyPreferDescriptiveVideo, CFBooleanRef, (), ())
#define MAAudibleMediaPrefCopyPreferDescriptiveVideo softLink_MediaAccessibility_MAAudibleMediaPrefCopyPreferDescriptiveVideo
SOFT_LINK_FUNCTION_MAY_FAIL_FOR_HEADER(WebCore, MediaAccessibility, MACaptionAppearanceIsCustomized, bool, (MACaptionAppearanceDomain domain), (domain))
#define MACaptionAppearanceIsCustomized softLink_MediaAccessibility_MACaptionAppearanceIsCustomized

#if COMPILER(MSVC)
#pragma warning(pop)
#endif

#endif // HAVE(MEDIA_ACCESSIBILITY_FRAMEWORK)

#endif // MediaAccessibilitySoftLink_h
