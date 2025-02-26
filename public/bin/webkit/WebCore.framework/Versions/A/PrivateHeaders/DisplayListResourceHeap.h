/*
 * Copyright (C) 2021-2023 Apple Inc. All rights reserved.
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

#include "DecomposedGlyphs.h"
#include "DisplayListItem.h"
#include "Filter.h"
#include "Font.h"
#include "FontCustomPlatformData.h"
#include "Gradient.h"
#include "ImageBuffer.h"
#include "NativeImage.h"
#include "RenderingResourceIdentifier.h"
#include "SourceImage.h"
#include <wtf/HashMap.h>
#include <wtf/RefCounted.h>

namespace WebCore {
namespace DisplayList {

class ResourceHeap {
public:
    using Resource = std::variant<
        std::monostate,
        Ref<ImageBuffer>,
        Ref<RenderingResource>,
        Ref<Font>,
        Ref<FontCustomPlatformData>
    >;

    void add(Ref<ImageBuffer>&& imageBuffer)
    {
        auto renderingResourceIdentifier = imageBuffer->renderingResourceIdentifier();
        add<ImageBuffer>(renderingResourceIdentifier, WTFMove(imageBuffer), m_imageBufferCount);
    }

    void add(Ref<NativeImage>&& image)
    {
        auto renderingResourceIdentifier = image->renderingResourceIdentifier();
        add<RenderingResource>(renderingResourceIdentifier, WTFMove(image), m_renderingResourceCount);
    }

    void add(Ref<DecomposedGlyphs>&& decomposedGlyphs)
    {
        auto renderingResourceIdentifier = decomposedGlyphs->renderingResourceIdentifier();
        add<RenderingResource>(renderingResourceIdentifier, WTFMove(decomposedGlyphs), m_renderingResourceCount);
    }

    void add(Ref<Gradient>&& gradient)
    {
        auto renderingResourceIdentifier = gradient->renderingResourceIdentifier();
        add<RenderingResource>(renderingResourceIdentifier, WTFMove(gradient), m_renderingResourceCount);
    }

    void add(Ref<Filter>&& filter)
    {
        auto renderingResourceIdentifier = filter->renderingResourceIdentifier();
        add<RenderingResource>(renderingResourceIdentifier, WTFMove(filter), m_renderingResourceCount);
    }

    void add(Ref<Font>&& font)
    {
        auto renderingResourceIdentifier = font->renderingResourceIdentifier();
        add<Font>(renderingResourceIdentifier, WTFMove(font), m_fontCount);
    }

    void add(Ref<FontCustomPlatformData>&& customPlatformData)
    {
        auto renderingResourceIdentifier = customPlatformData->m_renderingResourceIdentifier;
        add<FontCustomPlatformData>(renderingResourceIdentifier, WTFMove(customPlatformData), m_customPlatformDataCount);
    }

    ImageBuffer* getImageBuffer(RenderingResourceIdentifier renderingResourceIdentifier, OptionSet<ReplayOption> options = { }) const
    {
        auto* imageBuffer = get<ImageBuffer>(renderingResourceIdentifier);

#if USE(SKIA)
        if (imageBuffer && options.contains(ReplayOption::FlushImagesAndWaitForCompletion))
            imageBuffer->waitForAcceleratedRenderingFenceCompletion();
#else
        UNUSED_PARAM(options);
#endif

        return imageBuffer;
    }

    NativeImage* getNativeImage(RenderingResourceIdentifier renderingResourceIdentifier, OptionSet<ReplayOption> options = { }) const
    {
        auto* renderingResource = get<RenderingResource>(renderingResourceIdentifier);
        auto* nativeImage = dynamicDowncast<NativeImage>(renderingResource);

#if USE(SKIA)
        if (nativeImage && options.contains(ReplayOption::FlushImagesAndWaitForCompletion))
            nativeImage->backend().waitForAcceleratedRenderingFenceCompletion();
#else
        UNUSED_PARAM(options);
#endif

        return nativeImage;
    }

    std::optional<SourceImage> getSourceImage(RenderingResourceIdentifier renderingResourceIdentifier, OptionSet<ReplayOption> options = { }) const
    {
        if (auto nativeImage = getNativeImage(renderingResourceIdentifier, options))
            return { { *nativeImage } };

        if (auto imageBuffer = getImageBuffer(renderingResourceIdentifier, options))
            return { { *imageBuffer } };

        return std::nullopt;
    }

    DecomposedGlyphs* getDecomposedGlyphs(RenderingResourceIdentifier renderingResourceIdentifier) const
    {
        auto* renderingResource = get<RenderingResource>(renderingResourceIdentifier);
        return dynamicDowncast<DecomposedGlyphs>(renderingResource);
    }

    Gradient* getGradient(RenderingResourceIdentifier renderingResourceIdentifier) const
    {
        auto* renderingResource = get<RenderingResource>(renderingResourceIdentifier);
        return dynamicDowncast<Gradient>(renderingResource);
    }

    Filter* getFilter(RenderingResourceIdentifier renderingResourceIdentifier) const
    {
        auto* renderingResource = get<RenderingResource>(renderingResourceIdentifier);
        return dynamicDowncast<Filter>(renderingResource);
    }

    Font* getFont(RenderingResourceIdentifier renderingResourceIdentifier) const
    {
        return get<Font>(renderingResourceIdentifier);
    }

    FontCustomPlatformData* getFontCustomPlatformData(RenderingResourceIdentifier renderingResourceIdentifier) const
    {
        return get<FontCustomPlatformData>(renderingResourceIdentifier);
    }

    const UncheckedKeyHashMap<RenderingResourceIdentifier, Resource>& resources() const
    {
        return m_resources;
    }

    bool removeImageBuffer(RenderingResourceIdentifier renderingResourceIdentifier)
    {
        return remove<ImageBuffer>(renderingResourceIdentifier, m_imageBufferCount);
    }

    bool removeRenderingResource(RenderingResourceIdentifier renderingResourceIdentifier)
    {
        return remove<RenderingResource>(renderingResourceIdentifier, m_renderingResourceCount);
    }

    bool removeFont(RenderingResourceIdentifier renderingResourceIdentifier)
    {
        return remove<Font>(renderingResourceIdentifier, m_fontCount);
    }

    bool removeFontCustomPlatformData(RenderingResourceIdentifier renderingResourceIdentifier)
    {
        return remove<FontCustomPlatformData>(renderingResourceIdentifier, m_customPlatformDataCount);
    }

    void clearAllResources()
    {
        m_resources.clear();

        m_imageBufferCount = 0;
        m_renderingResourceCount = 0;
        m_fontCount = 0;
        m_customPlatformDataCount = 0;
    }

    void clearAllImageResources()
    {
        checkInvariants();

        m_resources.removeIf([&] (auto& resource) {
            auto value = std::get_if<Ref<RenderingResource>>(&resource.value);
            if (!value || !is<NativeImage>(value->get()))
                return false;
            --m_renderingResourceCount;
            return true;
        });

        checkInvariants();
    }

    void clearAllDrawingResources()
    {
        checkInvariants();

        if (!m_renderingResourceCount && !m_fontCount && !m_customPlatformDataCount)
            return;

        m_resources.removeIf([] (const auto& resource) {
            return std::holds_alternative<Ref<RenderingResource>>(resource.value)
                || std::holds_alternative<Ref<Font>>(resource.value)
                || std::holds_alternative<Ref<FontCustomPlatformData>>(resource.value);
        });

        m_renderingResourceCount = 0;
        m_fontCount = 0;
        m_customPlatformDataCount = 0;

        checkInvariants();
    }

private:
    template <typename T>
    void add(RenderingResourceIdentifier renderingResourceIdentifier, Ref<T>&& object, unsigned& counter)
    {
        checkInvariants();

        if (m_resources.add(renderingResourceIdentifier, WTFMove(object)).isNewEntry)
            ++counter;

        checkInvariants();
    }

    template <typename T>
    T* get(RenderingResourceIdentifier renderingResourceIdentifier) const
    {
        checkInvariants();

        auto iterator = m_resources.find(renderingResourceIdentifier);
        if (iterator == m_resources.end())
            return nullptr;

        auto value = std::get_if<Ref<T>>(&iterator->value);
        return value ? value->ptr() : nullptr;
    }

    template <typename T>
    bool remove(RenderingResourceIdentifier renderingResourceIdentifier, unsigned& counter)
    {
        checkInvariants();

        if (!counter)
            return false;

        auto iterator = m_resources.find(renderingResourceIdentifier);
        if (iterator == m_resources.end())
            return false;
        if (!std::holds_alternative<Ref<T>>(iterator->value))
            return false;

        auto result = m_resources.remove(iterator);
        ASSERT(result);
        --counter;

        checkInvariants();

        return result;
    }

    void checkInvariants() const
    {
#if ASSERT_ENABLED
        unsigned imageBufferCount = 0;
        unsigned renderingResourceCount = 0;
        unsigned fontCount = 0;
        unsigned customPlatformDataCount = 0;
        for (const auto& resource : m_resources) {
            if (std::holds_alternative<Ref<ImageBuffer>>(resource.value))
                ++imageBufferCount;
            else if (std::holds_alternative<Ref<RenderingResource>>(resource.value))
                ++renderingResourceCount;
            else if (std::holds_alternative<Ref<Font>>(resource.value))
                ++fontCount;
            else if (std::holds_alternative<Ref<FontCustomPlatformData>>(resource.value))
                ++customPlatformDataCount;
        }
        ASSERT(imageBufferCount == m_imageBufferCount);
        ASSERT(renderingResourceCount == m_renderingResourceCount);
        ASSERT(fontCount == m_fontCount);
        ASSERT(customPlatformDataCount == m_customPlatformDataCount);
        ASSERT(m_resources.size() == m_imageBufferCount + m_renderingResourceCount + m_fontCount + m_customPlatformDataCount);
#endif
    }

    UncheckedKeyHashMap<RenderingResourceIdentifier, Resource> m_resources;
    unsigned m_imageBufferCount { 0 };
    unsigned m_renderingResourceCount { 0 };
    unsigned m_fontCount { 0 };
    unsigned m_customPlatformDataCount { 0 };
};

} // namespace DisplayList
} // namespace WebCore
