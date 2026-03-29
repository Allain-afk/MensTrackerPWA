import { createContext, useContext, type ReactNode } from 'react';
import { useAppData } from './AppDataContext';

interface UserContextType {
  name: string;
  setName: (name: string) => void;
  initials: string;
}

const UserContext = createContext<UserContextType>({
  name: '',
  setName: () => {},
  initials: '',
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { snapshot, setName } = useAppData();
  const name = snapshot.profile.name;

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <UserContext.Provider value={{ name, setName, initials }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
