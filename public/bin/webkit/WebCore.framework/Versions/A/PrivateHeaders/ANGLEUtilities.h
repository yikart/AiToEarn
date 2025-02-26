/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#if ENABLE(WEBGL)

#include "GraphicsContextGL.h"
#include "GraphicsTypesGL.h"
#include <optional>
#include <wtf/Noncopyable.h>

namespace WebCore {

class ScopedRestoreTextureBinding {
    WTF_MAKE_NONCOPYABLE(ScopedRestoreTextureBinding);

public:
    ScopedRestoreTextureBinding(GCGLenum bindingPointQuery, GCGLenum bindingPoint, bool condition = true);
    ~ScopedRestoreTextureBinding();

private:
    GCGLenum m_bindingPoint { 0 };
    GCGLuint m_bindingValue { 0u };
};

class ScopedBufferBinding {
    WTF_MAKE_NONCOPYABLE(ScopedBufferBinding);

public:
    ScopedBufferBinding(GCGLenum bindingPoint, GCGLuint bindingValue, bool condition = true);
    ~ScopedBufferBinding();

private:
    static constexpr GCGLenum query(GCGLenum bindingPoint)
    {
        if (bindingPoint == GraphicsContextGL::PIXEL_PACK_BUFFER)
            return GraphicsContextGL::PIXEL_PACK_BUFFER_BINDING;
        ASSERT(bindingPoint == GraphicsContextGL::PIXEL_UNPACK_BUFFER);
        return GraphicsContextGL::PIXEL_UNPACK_BUFFER_BINDING;
    }
    GCGLint m_bindingPoint { 0 };
    GCGLuint m_bindingValue { 0u };
};

class ScopedRestoreReadFramebufferBinding {
    WTF_MAKE_NONCOPYABLE(ScopedRestoreReadFramebufferBinding);

public:
    ScopedRestoreReadFramebufferBinding(bool isForWebGL2, GCGLuint restoreValue)
        : m_framebufferTarget(isForWebGL2 ? GraphicsContextGL::READ_FRAMEBUFFER : GraphicsContextGL::FRAMEBUFFER)
        , m_bindingValue(restoreValue)
    {
    }
    ScopedRestoreReadFramebufferBinding(bool isForWebGL2, GCGLuint restoreValue, GCGLuint value)
        : m_framebufferTarget(isForWebGL2 ? GraphicsContextGL::READ_FRAMEBUFFER : GraphicsContextGL::FRAMEBUFFER)
        , m_bindingValue(restoreValue)
    {
        bindFramebuffer(value);
    }
    ~ScopedRestoreReadFramebufferBinding();
    void markBindingChanged()
    {
        m_bindingChanged = true;
    }
    void bindFramebuffer(GCGLuint bindingValue);
    GCGLuint framebufferTarget() const { return m_framebufferTarget; }

private:
    const GCGLenum m_framebufferTarget;
    GCGLuint m_bindingValue { 0u };
    bool m_bindingChanged { false };
};

class ScopedPixelStorageMode {
    WTF_MAKE_NONCOPYABLE(ScopedPixelStorageMode);

public:
    explicit ScopedPixelStorageMode(GCGLenum name, bool condition = true);
    ScopedPixelStorageMode(GCGLenum name, GCGLint value, bool condition = true);
    ~ScopedPixelStorageMode();
    void pixelStore(GCGLint value);
    operator GCGLint() const
    {
        ASSERT(m_name && !m_valueChanged);
        return m_originalValue;
    }

private:
    const GCGLenum m_name;
    bool m_valueChanged { false };
    GCGLint m_originalValue { 0 };
};

class ScopedTexture {
    WTF_MAKE_NONCOPYABLE(ScopedTexture);

public:
    ScopedTexture();
    ~ScopedTexture();
    operator GCGLuint() const
    {
        return m_object;
    }

private:
    GCGLuint m_object { 0u };
};

class ScopedFramebuffer {
    WTF_MAKE_NONCOPYABLE(ScopedFramebuffer);

public:
    ScopedFramebuffer();
    ~ScopedFramebuffer();
    operator GCGLuint() const
    {
        return m_object;
    }
private:
    GCGLuint m_object { 0 };
};

class ScopedGLFence {
    WTF_MAKE_NONCOPYABLE(ScopedGLFence);

public:
    ScopedGLFence() = default;
    ScopedGLFence(ScopedGLFence&& other)
        : m_object(std::exchange(other.m_object, { }))
    {
    }
    ~ScopedGLFence() { reset(); }
    ScopedGLFence& operator=(ScopedGLFence&& other)
    {
        if (this != &other) {
            reset();
            m_object = std::exchange(other.m_object, { });
        }
        return *this;
    }
    void reset();
    void abandon() { m_object = { }; }
    void fenceSync();
    GCGLsync get() const { return m_object; }
    operator GCGLsync() const { return m_object; }
    operator bool() const { return m_object; }

private:
    GCGLsync m_object { };
};

class ScopedGLCapability {
    WTF_MAKE_NONCOPYABLE(ScopedGLCapability);
public:
    ScopedGLCapability(GCGLenum capability, bool enable);
    ~ScopedGLCapability();

private:
    const GCGLenum m_capability;
    const std::optional<bool> m_original;
};

bool platformIsANGLEAvailable();

}

#endif
