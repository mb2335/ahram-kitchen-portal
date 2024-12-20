import { createContext, useContext, useState } from "react";

export interface MenuItem {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  price: number;
  image: string;
  quantity_limit: number;
}

interface CartContextType {
  items: MenuItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<MenuItem[]>([]);

  const addItem = (item: MenuItem) => {
    setItems((prevItems) => [...prevItems, item]);
  };

  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
