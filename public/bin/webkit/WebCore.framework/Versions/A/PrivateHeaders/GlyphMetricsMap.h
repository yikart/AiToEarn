/*
 * Copyright (C) 2006, 2009 Apple Inc. All rights reserved.
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

#ifndef GlyphMetricsMap_h
#define GlyphMetricsMap_h

#include "Glyph.h"
#include "Path.h"
#include <array>
#include <wtf/HashMap.h>
#include <wtf/TZoneMallocInlines.h>

namespace WebCore {

const float cGlyphSizeUnknown = -1;

template<class T> class GlyphMetricsMap {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(GlyphMetricsMap);
public:
    T metricsForGlyph(Glyph glyph)
    {
        return locatePage(glyph / GlyphMetricsPage::size).metricsForGlyph(glyph);
    }

    const T& existingMetricsForGlyph(Glyph glyph)
    {
        return locatePage(glyph / GlyphMetricsPage::size).existingMetricsForGlyph(glyph);
    }

    void setMetricsForGlyph(Glyph glyph, const T& metrics)
    {
        locatePage(glyph / GlyphMetricsPage::size).setMetricsForGlyph(glyph, metrics);
    }

private:
    class GlyphMetricsPage {
        WTF_MAKE_TZONE_ALLOCATED_INLINE(GlyphMetricsPage);
    public:
        static const size_t size = 16;

        GlyphMetricsPage() = default;
        explicit GlyphMetricsPage(const T& initialValue)
        {
            fill(initialValue);
        }

        void fill(const T& value)
        {
            m_metrics.fill(value);
        }

        T metricsForGlyph(Glyph glyph) const { return m_metrics[glyph % size]; }
        const T& existingMetricsForGlyph(Glyph glyph) const { return m_metrics[glyph % size]; }
        void setMetricsForGlyph(Glyph glyph, const T& metrics)
        {
            setMetricsForIndex(glyph % size, metrics);
        }

    private:
        void setMetricsForIndex(unsigned index, const T& metrics)
        {
            m_metrics[index] = metrics;
        }

        std::array<T, size> m_metrics;
    };
    
    GlyphMetricsPage& locatePage(unsigned pageNumber)
    {
        if (!pageNumber && m_filledPrimaryPage)
            return m_primaryPage;
        return locatePageSlowCase(pageNumber);
    }

    GlyphMetricsPage& locatePageSlowCase(unsigned pageNumber);
    
    static T unknownMetrics();

    bool m_filledPrimaryPage { false };
    GlyphMetricsPage m_primaryPage; // We optimize for the page that contains glyph indices 0-255.
    UncheckedKeyHashMap<int, std::unique_ptr<GlyphMetricsPage>> m_pages;
};

template<> inline float GlyphMetricsMap<float>::unknownMetrics()
{
    return cGlyphSizeUnknown;
}

template<> inline FloatRect GlyphMetricsMap<FloatRect>::unknownMetrics()
{
    return FloatRect(0, 0, cGlyphSizeUnknown, cGlyphSizeUnknown);
}

template<> inline std::optional<Path> GlyphMetricsMap<std::optional<Path>>::unknownMetrics()
{
    return std::nullopt;
}

template<class T> typename GlyphMetricsMap<T>::GlyphMetricsPage& GlyphMetricsMap<T>::locatePageSlowCase(unsigned pageNumber)
{
    if (!pageNumber) {
        ASSERT(!m_filledPrimaryPage);
        m_primaryPage.fill(unknownMetrics());
        m_filledPrimaryPage = true;
        return m_primaryPage;
    }

    return *m_pages.ensure(pageNumber, [] {
        return makeUnique<GlyphMetricsPage>(unknownMetrics());
    }).iterator->value;
}
    
} // namespace WebCore

#endif
