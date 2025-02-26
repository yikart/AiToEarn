/*
    Copyright (C) 2010 Nokia Corporation and/or its subsidiary(-ies)

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
*/

#pragma once

#include "StorageSessionProvider.h"
#include <wtf/RetainPtr.h>
#include <wtf/text/WTFString.h>

#if PLATFORM(COCOA)
#include <wtf/SchedulePair.h>
#endif

#if PLATFORM(COCOA)
OBJC_CLASS NSOperationQueue;
#endif

#if USE(SOUP)
typedef struct _SoupSession SoupSession;
#endif

namespace WebCore {

class NetworkStorageSession;
class ResourceError;
class ResourceRequest;

class NetworkingContext : public StorageSessionProvider {
public:
    virtual ~NetworkingContext() = default;

    virtual bool isValid() const { return true; }

    virtual bool shouldClearReferrerOnHTTPSToHTTPRedirect() const = 0;

#if PLATFORM(COCOA)
    virtual bool localFileContentSniffingEnabled() const = 0; // FIXME: Reconcile with ResourceHandle::forceContentSniffing().
    virtual SchedulePairHashSet* scheduledRunLoopPairs() const { return 0; }
    virtual RetainPtr<CFDataRef> sourceApplicationAuditData() const = 0;
    virtual ResourceError blockedError(const ResourceRequest&) const = 0;
#endif

    virtual String sourceApplicationIdentifier() const { return emptyString(); }

#if PLATFORM(WIN)
    virtual ResourceError blockedError(const ResourceRequest&) const = 0;
#endif

protected:
    NetworkingContext() = default;
};

}
