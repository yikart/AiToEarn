/*
 * Copyright (C) 2005-2014 Apple Inc. All rights reserved.
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

#include "DisabledAdaptations.h"
#include "FloatSize.h"
#include "IntSize.h"
#include "ViewportArguments.h"
#include <wtf/Noncopyable.h>
#include <wtf/OptionSet.h>
#include <wtf/TZoneMalloc.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

class ViewportConfiguration {
    WTF_MAKE_TZONE_ALLOCATED(ViewportConfiguration);
    WTF_MAKE_NONCOPYABLE(ViewportConfiguration);
public:
    // FIXME: unify with ViewportArguments.
    struct Parameters {
        double width { 0 };
        double height { 0 };
        double initialScale { 0 };
        double initialScaleIgnoringLayoutScaleFactor { 0 };
        double minimumScale { 0 };
        double maximumScale { 0 };
        bool allowsUserScaling { false };
        bool allowsShrinkToFit { false };
        bool avoidsUnsafeArea { true };

        bool widthIsSet { false };
        bool heightIsSet { false };
        bool initialScaleIsSet { false };

        bool ignoreInitialScaleForLayoutWidth { false };

        bool shouldHonorMinimumEffectiveDeviceWidthFromClient { true };

        friend bool operator==(const Parameters&, const Parameters&) = default;
    };

    WEBCORE_EXPORT ViewportConfiguration();

    const Parameters& defaultConfiguration() const { return m_defaultConfiguration; }
    WEBCORE_EXPORT void setDefaultConfiguration(const Parameters&);

    const IntSize& contentsSize() const { return m_contentSize; }
    WEBCORE_EXPORT bool setContentsSize(const IntSize&);

    const FloatSize& viewLayoutSize() const { return m_viewLayoutSize; }

    const FloatSize& minimumLayoutSize() const { return m_minimumLayoutSize; }
    WEBCORE_EXPORT bool setViewLayoutSize(const FloatSize&, std::optional<double>&& scaleFactor = std::nullopt, std::optional<double>&& effectiveWidth = std::nullopt);

    const OptionSet<DisabledAdaptations>& disabledAdaptations() const { return m_disabledAdaptations; }
    WEBCORE_EXPORT bool setDisabledAdaptations(const OptionSet<DisabledAdaptations>&);

    const ViewportArguments& viewportArguments() const { return m_viewportArguments; }
    WEBCORE_EXPORT bool setViewportArguments(const ViewportArguments&);

    WEBCORE_EXPORT bool setCanIgnoreScalingConstraints(bool);
    constexpr bool canIgnoreScalingConstraints() const { return m_canIgnoreScalingConstraints; }

    WEBCORE_EXPORT bool setMinimumEffectiveDeviceWidthWhenIgnoringScalingConstraints(double);
    WEBCORE_EXPORT bool setMinimumEffectiveDeviceWidthForShrinkToFit(double);
    constexpr double minimumEffectiveDeviceWidth() const
    {
        double minimumEffectiveDeviceWidth = m_minimumEffectiveDeviceWidthForView;

        if (!shouldIgnoreMinimumEffectiveDeviceWidthForShrinkToFit())
            minimumEffectiveDeviceWidth = std::max(minimumEffectiveDeviceWidth, m_canIgnoreScalingConstraints ? m_minimumEffectiveDeviceWidthWhenIgnoringScalingConstraints : m_minimumEffectiveDeviceWidthForShrinkToFit);

        return minimumEffectiveDeviceWidth;
    }

    constexpr bool isKnownToLayOutWiderThanViewport() const { return m_isKnownToLayOutWiderThanViewport; }
    WEBCORE_EXPORT bool setIsKnownToLayOutWiderThanViewport(bool value);

    constexpr bool shouldIgnoreMinimumEffectiveDeviceWidthForShrinkToFit() const
    {
        if (shouldShrinkToFitMinimumEffectiveDeviceWidthWhenIgnoringScalingConstraints())
            return false;

        if (m_canIgnoreScalingConstraints)
            return true;

        if (m_viewportArguments == ViewportArguments())
            return false;

        if ((m_viewportArguments.zoom == 1. || m_viewportArguments.width == ViewportArguments::ValueDeviceWidth) && !m_isKnownToLayOutWiderThanViewport)
            return true;

        return false;
    }

    constexpr bool shouldShrinkToFitMinimumEffectiveDeviceWidthWhenIgnoringScalingConstraints() const
    {
        return m_canIgnoreScalingConstraints && m_minimumEffectiveDeviceWidthWhenIgnoringScalingConstraints;
    }

    void setForceAlwaysUserScalable(bool forceAlwaysUserScalable) { m_forceAlwaysUserScalable = forceAlwaysUserScalable; }
    double layoutSizeScaleFactor() const { return m_layoutSizeScaleFactor; }

    void setPrefersHorizontalScrollingBelowDesktopViewportWidths(bool value) { m_prefersHorizontalScrollingBelowDesktopViewportWidths = value; }
    void setCanIgnoreViewportArgumentsToAvoidExcessiveZoom(bool value) { m_canIgnoreViewportArgumentsToAvoidExcessiveZoom = value; }

    WEBCORE_EXPORT IntSize layoutSize() const;
    WEBCORE_EXPORT int layoutWidth() const;
    WEBCORE_EXPORT int layoutHeight() const;
    WEBCORE_EXPORT double initialScale() const;
    WEBCORE_EXPORT double initialScaleIgnoringContentSize() const;
    WEBCORE_EXPORT double minimumScale() const;
    double maximumScale() const { return m_forceAlwaysUserScalable ? forceAlwaysUserScalableMaximumScale() : m_configuration.maximumScale; }
    double maximumScaleIgnoringAlwaysScalable() const { return m_configuration.maximumScale; }
    WEBCORE_EXPORT bool allowsUserScaling() const;
    WEBCORE_EXPORT bool allowsUserScalingIgnoringAlwaysScalable() const;
    bool avoidsUnsafeArea() const { return m_configuration.avoidsUnsafeArea; }

    // Matches a width=device-width, initial-scale=1 viewport.
    WEBCORE_EXPORT Parameters nativeWebpageParameters();
    static Parameters nativeWebpageParametersWithoutShrinkToFit();
    static Parameters nativeWebpageParametersWithShrinkToFit();
#if ENABLE(PDF_PLUGIN)
    WEBCORE_EXPORT static Parameters pluginDocumentParameters();
#endif
    WEBCORE_EXPORT static Parameters webpageParameters();
    WEBCORE_EXPORT static Parameters textDocumentParameters();
    WEBCORE_EXPORT static Parameters imageDocumentParameters();
    WEBCORE_EXPORT static Parameters xhtmlMobileParameters();
    WEBCORE_EXPORT static Parameters testingParameters();

    String description() const;
#if !LOG_DISABLED
    WEBCORE_EXPORT void dump() const;
#endif

private:
    void updateConfiguration();
    double viewportArgumentsLength(double length) const;
    double initialScaleFromSize(double width, double height, bool shouldIgnoreScalingConstraints) const;

    bool shouldOverrideDeviceWidthAndShrinkToFit() const;
    bool shouldIgnoreScalingConstraintsRegardlessOfContentSize() const;
    bool shouldIgnoreScalingConstraints() const;
    bool shouldIgnoreVerticalScalingConstraints() const;
    bool shouldIgnoreHorizontalScalingConstraints() const;
    void updateDefaultConfiguration();
    bool canOverrideConfigurationParameters() const;

    constexpr bool layoutSizeIsExplicitlyScaled() const
    {
        return m_layoutSizeScaleFactor != 1;
    }

    constexpr double forceAlwaysUserScalableMaximumScale() const
    {
        const double forceAlwaysUserScalableMaximumScaleIgnoringLayoutScaleFactor = 5;
        return forceAlwaysUserScalableMaximumScaleIgnoringLayoutScaleFactor * effectiveLayoutSizeScaleFactor();
    }

    constexpr double forceAlwaysUserScalableMinimumScale() const
    {
        const double forceAlwaysUserScalableMinimumScaleIgnoringLayoutScaleFactor = 1;
        return forceAlwaysUserScalableMinimumScaleIgnoringLayoutScaleFactor * effectiveLayoutSizeScaleFactor();
    }

    constexpr double effectiveLayoutSizeScaleFactor() const
    {
        if (!m_viewLayoutSize.width() || !minimumEffectiveDeviceWidth())
            return m_layoutSizeScaleFactor;
        return m_layoutSizeScaleFactor * m_viewLayoutSize.width() / std::max<double>(minimumEffectiveDeviceWidth(), m_viewLayoutSize.width());
    }

    void updateMinimumLayoutSize();

    Parameters m_configuration;
    Parameters m_defaultConfiguration;
    IntSize m_contentSize;
    FloatSize m_minimumLayoutSize;
    FloatSize m_viewLayoutSize;
    ViewportArguments m_viewportArguments;
    OptionSet<DisabledAdaptations> m_disabledAdaptations;

    double m_layoutSizeScaleFactor { 1 };
    double m_minimumEffectiveDeviceWidthForView { 0 };
    double m_minimumEffectiveDeviceWidthForShrinkToFit { 0 };
    double m_minimumEffectiveDeviceWidthWhenIgnoringScalingConstraints { 0 };
    bool m_canIgnoreScalingConstraints;
    bool m_forceAlwaysUserScalable;
    bool m_isKnownToLayOutWiderThanViewport { false };
    bool m_prefersHorizontalScrollingBelowDesktopViewportWidths { false };
    bool m_canIgnoreViewportArgumentsToAvoidExcessiveZoom { false };
    bool m_minimumEffectiveDeviceWidthWasSetByClient { false };
};

WTF::TextStream& operator<<(WTF::TextStream&, const ViewportConfiguration::Parameters&);
WTF::TextStream& operator<<(WTF::TextStream&, const ViewportConfiguration&);

} // namespace WebCore
