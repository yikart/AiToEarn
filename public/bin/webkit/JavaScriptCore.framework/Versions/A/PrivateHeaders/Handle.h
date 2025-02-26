/*
 * Copyright (C) 2011 Apple Inc. All rights reserved.
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

#include "HandleForward.h"
#include "HandleTypes.h"

namespace JSC {

/*
    A Handle is a smart pointer that updates automatically when the garbage
    collector moves the object to which it points.

    The base Handle class represents a temporary reference to a pointer whose
    lifetime is guaranteed by something else.
*/

// Creating a JSValue Handle is invalid
template <> class Handle<JSValue>;

class HandleBase {
    template <typename T> friend class Weak;
    template <typename T, ShouldStrongDestructorGrabLock shouldStrongDestructorGrabLock> friend class Strong;
    friend class HandleSet;
    friend struct JSCallbackObjectData;

public:
    bool operator!() const { return !m_slot || !*m_slot; }

    explicit operator bool() const { return m_slot && *m_slot; }

    HandleSlot slot() const { return m_slot; }

protected:
    HandleBase(HandleSlot slot)
        : m_slot(slot)
    {
    }
    
    void swap(HandleBase& other) { std::swap(m_slot, other.m_slot); }

    void setSlot(HandleSlot slot)
    {
        m_slot = slot;
    }

private:
    HandleSlot m_slot;
};

template <typename Base, typename T> struct HandleConverter {
    T* operator->()
    {
        return static_cast<Base*>(this)->get();
    }
    const T* operator->() const
    {
        return static_cast<const Base*>(this)->get();
    }

    T* operator*()
    {
        return static_cast<Base*>(this)->get();
    }
    const T* operator*() const
    {
        return static_cast<const Base*>(this)->get();
    }
};

template <typename Base> struct HandleConverter<Base, Unknown> {
    Handle<JSObject> asObject() const;
    bool isObject() const { return jsValue().isObject(); }
    bool getNumber(double number) const { return jsValue().getNumber(number); }
    WTF::String getString(JSGlobalObject*) const;
    bool isUndefinedOrNull() const { return jsValue().isUndefinedOrNull(); }

private:
    JSValue jsValue() const
    {
        return static_cast<const Base*>(this)->get();
    }
};

template <typename T> class Handle : public HandleBase, public HandleConverter<Handle<T>, T> {
public:
    template <typename A, typename B> friend struct HandleConverter;
    typedef typename HandleTypes<T>::ExternalType ExternalType;
    template <typename U> Handle(Handle<U> o)
    {
        typename HandleTypes<T>::template validateUpcast<U>();
        setSlot(o.slot());
    }

    virtual ~Handle() = default;

    void swap(Handle& other) { HandleBase::swap(other); }

    ExternalType get() const { return HandleTypes<T>::getFromSlot(this->slot()); }

protected:
    Handle(HandleSlot slot = nullptr)
        : HandleBase(slot)
    {
    }

private:
    friend class HandleSet;
    friend class WeakBlock;

    static Handle<T> wrapSlot(HandleSlot slot)
    {
        return Handle<T>(slot);
    }
};

template <typename Base> Handle<JSObject> HandleConverter<Base, Unknown>::asObject() const
{
    return Handle<JSObject>::wrapSlot(static_cast<const Base*>(this)->slot());
}

template <typename T, typename U> inline bool operator==(const Handle<T>& a, const Handle<U>& b)
{ 
    return a.get() == b.get(); 
}

template <typename T, typename U> inline bool operator==(const Handle<T>& a, U* b)
{ 
    return a.get() == b; 
}

template <typename T, typename U> inline bool operator==(T* a, const Handle<U>& b) 
{
    return a == b.get(); 
}

} // namespace JSC
