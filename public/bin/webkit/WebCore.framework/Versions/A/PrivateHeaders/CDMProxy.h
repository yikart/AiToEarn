/*
 * Copyright (C) 2020 Metrological Group B.V.
 * Copyright (C) 2020 Igalia S.L.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if ENABLE(ENCRYPTED_MEDIA)

#include "CDMInstance.h"
#include "CDMInstanceSession.h"
#include "SharedBuffer.h"
#include <wtf/BoxPtr.h>
#include <wtf/Condition.h>
#include <wtf/HashMap.h>
#include <wtf/HashSet.h>
#include <wtf/Lock.h>
#include <wtf/VectorHash.h>

#if ENABLE(THUNDER)
#include "CDMOpenCDMTypes.h"
#endif

namespace WebCore {
class CDMProxyDecryptionClient;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::CDMProxyDecryptionClient> : std::true_type { };
}

namespace WebCore {

class MediaPlayer;
class SharedBuffer;

using KeyIDType = Vector<uint8_t>;
using KeyHandleValueVariant = std::variant<
    Vector<uint8_t>
#if ENABLE(THUNDER)
    , BoxPtr<OpenCDMSession>
#endif
>;

class KeyHandle : public ThreadSafeRefCounted<KeyHandle> {
public:
    using KeyStatus = CDMInstanceSession::KeyStatus;

    static RefPtr<KeyHandle> create(KeyStatus status, KeyIDType&& keyID, KeyHandleValueVariant&& keyHandleValue)
    {
        return adoptRef(*new KeyHandle(status, WTFMove(keyID), WTFMove(keyHandleValue)));
    }

    virtual ~KeyHandle() { }

    Ref<SharedBuffer> idAsSharedBuffer() const { return SharedBuffer::create(m_id.span()); }

    bool takeValueIfDifferent(KeyHandleValueVariant&&);

    const KeyIDType& id() const { return m_id; }
    const KeyHandleValueVariant& value() const { return m_value; }
    KeyHandleValueVariant& value() { return m_value; }
    KeyStatus status() const { return m_status; }
    bool isStatusCurrentlyValid()
    {
        return m_status == CDMInstanceSession::KeyStatus::Usable || m_status == CDMInstanceSession::KeyStatus::OutputRestricted
            || m_status == CDMInstanceSession::KeyStatus::OutputDownscaled;
    }

    String idAsString() const;

    // Two keys are equal if they have the same ID, ignoring key value and status.
    friend bool operator==(const KeyHandle &k1, const KeyHandle &k2) { return k1.m_id == k2.m_id; }
    friend bool operator==(const KeyHandle &k, const KeyIDType& keyID) { return k.m_id == keyID; }
    friend bool operator==(const KeyIDType& keyID, const KeyHandle &k) { return k == keyID; }

protected:

    KeyHandle(KeyStatus status, const KeyIDType& keyID, const KeyHandleValueVariant& keyHandleValue)
        : m_status(status)
        , m_id(keyID)
        , m_value(keyHandleValue)
    {
    }

    KeyStatus m_status;
    KeyIDType m_id;
    KeyHandleValueVariant m_value;

private:
    KeyHandle(KeyStatus status, KeyIDType&& keyID, KeyHandleValueVariant&& keyHandleValue)
        : m_status(status)
        , m_id(WTFMove(keyID))
        , m_value(WTFMove(keyHandleValue))
    {
    }
};

using KeyStoreIDType = unsigned;
KeyStoreIDType keyStoreBaseNextID();

template<typename T>
class KeyStoreBase {
public:
    using KeyStatusVector = CDMInstanceSession::KeyStatusVector;

    KeyStoreBase()
        : m_id(keyStoreBaseNextID())
    {
    }

    bool add(RefPtr<T>&& key)
    {
        auto findingResult = m_keys.find(key->id());
        if (findingResult != m_keys.end() && findingResult->value == key)
            return false;

        m_keys.set(key->id(), WTFMove(key));
        return true;
    }

    bool addKeys(Vector<RefPtr<T>>&& newKeys)
    {
        bool didKeyStoreChange = false;
        for (auto& key : newKeys) {
            if (add(WTFMove(key)))
                didKeyStoreChange = true;
        }
        return didKeyStoreChange;
    }

    void remove(const RefPtr<T>& key) { m_keys.remove(key->id()); }
    void clear() { m_keys.clear(); }
    bool containsKeyID(const KeyIDType& keyID) const { return m_keys.contains(keyID); }

    WARN_UNUSED_RETURN RefPtr<T> keyHandle(const KeyIDType& keyID) const
    {
        auto findingResult = m_keys.find(keyID);
        if (findingResult == m_keys.end())
            return { };
        return findingResult->value;
    }

    WARN_UNUSED_RETURN KeyStatusVector allKeysAs(CDMInstanceSession::KeyStatus status) const
    {
        CDMInstanceSession::KeyStatusVector keyStatusVector = convertToJSKeyStatusVector();
        for (auto& keyStatus : keyStatusVector)
            keyStatus.second = status;
        return keyStatusVector;
    }

    WARN_UNUSED_RETURN KeyStatusVector convertToJSKeyStatusVector() const
    {
        KeyStoreBase::KeyStatusVector vector;
        for (const auto& key : m_keys.values())
            vector.append(std::pair { key->idAsSharedBuffer(), key->status() });
        return vector;
    }

    unsigned numKeys() const { return m_keys.size(); }
    auto values() const { return m_keys.values(); }
    KeyStoreIDType id() const { return m_id; }

    auto begin() { return m_keys.begin(); }
    auto begin() const { return m_keys.begin(); }
    auto end() { return m_keys.end(); }
    auto end() const { return m_keys.end(); }

protected:
    UncheckedKeyHashMap<KeyIDType, RefPtr<T>> m_keys;

private:
    KeyStoreIDType m_id;
};

using KeyStore = KeyStoreBase<KeyHandle>;

class ReferenceAwareKeyHandle : public KeyHandle {
public:
    static RefPtr<ReferenceAwareKeyHandle> createFrom(const RefPtr<KeyHandle>& other, KeyStoreIDType keyStoreID)
    {
        RELEASE_ASSERT(other);
        return adoptRef(*new ReferenceAwareKeyHandle(other->status(), other->id(), other->value(), keyStoreID));
    }

    void updateKeyFrom(RefPtr<ReferenceAwareKeyHandle>&& other)
    {
        ASSERT(isMainThread());
        ASSERT(m_id == other->id());
        m_status = other->status();
        m_value = other->value();
        m_references = m_references.unionWith(other->m_references);
    }
    bool hasReferences() const { return !m_references.isEmpty(); }

private:
    friend class ReferenceAwareKeyStore;

    ReferenceAwareKeyHandle(KeyStatus status, const KeyIDType& keyID, const KeyHandleValueVariant& keyHandleValue, KeyStoreIDType storeID)
        : KeyHandle(status, keyID, keyHandleValue)
    {
        m_references.add(storeID);
    }

    void removeReference(KeyStoreIDType id)
    {
        ASSERT(isMainThread());
        m_references.remove(id);
    }

    HashSet<KeyStoreIDType> m_references;
};

class ReferenceAwareKeyStore : public KeyStoreBase<ReferenceAwareKeyHandle> {
public:
    ReferenceAwareKeyStore() = default;

    void merge(const KeyStore&);
    void unrefAllKeysFrom(const KeyStore&);
};

class CDMInstanceProxy;
class CDMProxyDecryptionClient;

// Handle to a "real" CDM, not the JavaScript facade. This can be used
// from background threads (i.e. decryptors).
class CDMProxy : public ThreadSafeRefCounted<CDMProxy> {
public:
    static constexpr Seconds MaxKeyWaitTimeSeconds = 7_s;

    virtual ~CDMProxy() = default;

    void updateKeyStore(const KeyStore&);
    void unrefAllKeysFrom(const KeyStore&);
    void setInstance(CDMInstanceProxy*);
    void abortWaitingForKey() const;

protected:
    RefPtr<KeyHandle> keyHandle(const KeyIDType&) const;
    bool isKeyAvailable(const KeyIDType&) const;
    bool isKeyAvailableUnlocked(const KeyIDType&) const WTF_REQUIRES_LOCK(m_keysLock);
    std::optional<Ref<KeyHandle>> tryWaitForKeyHandle(const KeyIDType&, WeakPtr<CDMProxyDecryptionClient>&&) const;
    std::optional<Ref<KeyHandle>> getOrWaitForKeyHandle(const KeyIDType&, WeakPtr<CDMProxyDecryptionClient>&&) const;
    std::optional<KeyHandleValueVariant> getOrWaitForKeyValue(const KeyIDType&, WeakPtr<CDMProxyDecryptionClient>&&) const;
    void startedWaitingForKey() const;
    void stoppedWaitingForKey() const;
    const CDMInstanceProxy* instance() const;

private:
    mutable Lock m_instanceLock;
    CDMInstanceProxy* m_instance WTF_GUARDED_BY_LOCK(m_instanceLock);

    mutable Lock m_keysLock;
    mutable Condition m_keysCondition;
    // FIXME: Duplicated key stores in the instance and the proxy are probably not needed, but simplified
    // the initial implementation in terms of threading invariants.
    ReferenceAwareKeyStore m_keyStore WTF_GUARDED_BY_LOCK(m_keysLock);
};

class CDMProxyFactory {
public:
    virtual ~CDMProxyFactory()
    {
        unregisterFactory(*this);
    };

    WEBCORE_EXPORT static void registerFactory(CDMProxyFactory&);
    WEBCORE_EXPORT static void unregisterFactory(CDMProxyFactory&);
    WEBCORE_EXPORT static WARN_UNUSED_RETURN RefPtr<CDMProxy> createCDMProxyForKeySystem(const String&);

protected:
    virtual RefPtr<CDMProxy> createCDMProxy(const String&) = 0;
    virtual bool supportsKeySystem(const String&) = 0;

private:
    // Platform-specific function that's called when the list of
    // registered CDMProxyFactory objects is queried for the first time.
    static Vector<CDMProxyFactory*> platformRegisterFactories();
    WEBCORE_EXPORT static Vector<CDMProxyFactory*>& registeredFactories();
};

class CDMInstanceProxy;

class CDMInstanceSessionProxy : public CDMInstanceSession, public CanMakeWeakPtr<CDMInstanceSessionProxy, WeakPtrFactoryInitialization::Eager> {
protected:
    CDMInstanceSessionProxy(CDMInstanceProxy&);
    const WeakPtr<CDMInstanceProxy>& cdmInstanceProxy() const { return m_instance; }

private:
    WeakPtr<CDMInstanceProxy> m_instance;
};

// Base class for common session management code and for communicating messages
// from "real CDM" state changes to JS.
class CDMInstanceProxy : public CDMInstance, public CanMakeWeakPtr<CDMInstanceProxy> {
public:
    explicit CDMInstanceProxy(const String& keySystem)
    {
        ASSERT(isMainThread());
        m_cdmProxy = CDMProxyFactory::createCDMProxyForKeySystem(keySystem);
        if (m_cdmProxy)
            m_cdmProxy->setInstance(this);
    }
    virtual ~CDMInstanceProxy() = default;

    // Main-thread only.
    void mergeKeysFrom(const KeyStore&);
    void unrefAllKeysFrom(const KeyStore&);

    // Media player query methods - main thread only.
    const RefPtr<CDMProxy>& proxy() const { ASSERT(isMainThread()); return m_cdmProxy; }
    virtual bool isWaitingForKey() const { ASSERT(isMainThread()); return m_numDecryptorsWaitingForKey > 0; }
    void setPlayer(ThreadSafeWeakPtr<MediaPlayer>&& player) { ASSERT(isMainThread()); m_player = WTFMove(player); }

    // Proxy methods - must be thread-safe.
    void startedWaitingForKey();
    void stoppedWaitingForKey();

private:
    RefPtr<CDMProxy> m_cdmProxy;
    ThreadSafeWeakPtr<MediaPlayer> m_player;

    std::atomic<int> m_numDecryptorsWaitingForKey { 0 };
};

class CDMProxyDecryptionClient : public CanMakeWeakPtr<CDMProxyDecryptionClient, WeakPtrFactoryInitialization::Eager> {
public:
    virtual bool isAborting() = 0;
    virtual ~CDMProxyDecryptionClient() = default;
};

} // namespace WebCore

#endif // ENABLE(ENCRYPTED_MEDIA)
