/*
 * Copyright (C) 2009, 2010, 2013 Apple Inc. All rights reserved.
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

#include "LocalDOMWindow.h"
#include <wtf/URL.h>
#include "ScriptCachedFrameData.h"
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>

namespace WebCore {

class CachedFrame;
class CachedFramePlatformData;
class Document;
class DocumentLoader;
class LocalFrameView;
class Node;
enum class HasInsecureContent : bool;
enum class UsedLegacyTLS : bool;
enum class WasPrivateRelayed : bool;

class CachedFrameBase {
public:
    void restore();

    Document* document() const { return m_document.get(); }
    FrameView* view() const { return m_view.get(); }
    RefPtr<FrameView> protectedView() const;
    const URL& url() const { return m_url; }
    bool isMainFrame() { return m_isMainFrame; }

protected:
    CachedFrameBase(Frame&);
    ~CachedFrameBase();

    void pruneDetachedChildFrames();

    RefPtr<Document> m_document;
    RefPtr<DocumentLoader> m_documentLoader;
    RefPtr<FrameView> m_view;
    URL m_url;
    std::unique_ptr<ScriptCachedFrameData> m_cachedFrameScriptData;
    std::unique_ptr<CachedFramePlatformData> m_cachedFramePlatformData;
    bool m_isMainFrame;

    Vector<UniqueRef<CachedFrame>> m_childFrames;

private:
    void initializeWithLocalFrame(LocalFrame&);
};

class CachedFrame : private CachedFrameBase {
    WTF_MAKE_TZONE_ALLOCATED(CachedFrame);
public:
    explicit CachedFrame(Frame&);

    void open();
    void clear();
    void destroy();

    WEBCORE_EXPORT void setCachedFramePlatformData(std::unique_ptr<CachedFramePlatformData>);
    WEBCORE_EXPORT CachedFramePlatformData* cachedFramePlatformData();

    HasInsecureContent hasInsecureContent() const;
    UsedLegacyTLS usedLegacyTLS() const;
    WasPrivateRelayed wasPrivateRelayed() const;

    using CachedFrameBase::document;
    using CachedFrameBase::view;
    using CachedFrameBase::url;
    DocumentLoader* documentLoader() const { return m_documentLoader.get(); }

    size_t descendantFrameCount() const;
};

} // namespace WebCore
