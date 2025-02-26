/*
    Copyright (C) 1998 Lars Knoll (knoll@mpi-hd.mpg.de)
    Copyright (C) 2001 Dirk Mueller <mueller@kde.org>
    Copyright (C) 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011 Apple Inc. All rights reserved.

    This library is free software; you can redistribute it and/or
    modify it under the terms of the GNU Library General Public
    License as published by the Free Software Foundation; either
    version 2 of the License, or (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
    Library General Public License for more details.

    You should have received a copy of the GNU Library General Public License
    along with this library; see the file COPYING.LIB.  If not, write to
    the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
    Boston, MA 02110-1301, USA.

    This class provides all functionality needed for loading images, style sheets and html
    pages from the web. It has a memory cache for these objects.
*/

#pragma once

#include "FrameLoaderTypes.h"
#include <wtf/Noncopyable.h>
#include <wtf/WeakHashSet.h>
#include <wtf/WeakPtr.h>

namespace WebCore {
class CachedResourceClient;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::CachedResourceClient> : std::true_type { };
}

namespace WebCore {

class CachedResource;
class NetworkLoadMetrics;

class WEBCORE_EXPORT CachedResourceClient : public CanMakeSingleThreadWeakPtr<CachedResourceClient> {
    WTF_MAKE_NONCOPYABLE(CachedResourceClient);
public:
    enum CachedResourceClientType {
        BaseResourceType,
        ImageType,
        FontType,
        StyleSheetType,
        SVGDocumentType,
        RawResourceType
    };

    virtual ~CachedResourceClient();

    virtual void notifyFinished(CachedResource&, const NetworkLoadMetrics&, LoadWillContinueInAnotherProcess = LoadWillContinueInAnotherProcess::No);
    virtual void deprecatedDidReceiveCachedResource(CachedResource&);

    static CachedResourceClientType expectedType();
    virtual CachedResourceClientType resourceClientType() const;
    virtual bool shouldMarkAsReferenced() const;

#if ASSERT_ENABLED
    void addAssociatedResource(CachedResource&);
    void removeAssociatedResource(CachedResource&);
#endif

protected:
    CachedResourceClient();

private:
#if ASSERT_ENABLED
    WeakHashSet<CachedResource> m_associatedResources;
#endif
};

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_CACHED_RESOURCE_CLIENT(ToClassName, CachedResourceTypeValue) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ToClassName) \
    static bool isType(const WebCore::CachedResourceClient& client) { return client.resourceClientType() == WebCore::CachedResourceClient::CachedResourceTypeValue; } \
SPECIALIZE_TYPE_TRAITS_END()
