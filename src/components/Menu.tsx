import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart, MenuItem } from "@/contexts/CartContext";

const menuItems: MenuItem[] = [
  {
    id: "1",
    name: "Bulgogi",
    nameKo: "불고기",
    description: "Marinated beef with vegetables",
    descriptionKo: "야채를 곁들인 불고기",
    price: 15.99,
    image: "/placeholder.svg",
    category: "main",
  },
  {
    id: "2",
    name: "Kimchi Stew",
    nameKo: "김치찌개",
    description: "Traditional kimchi stew with pork",
    descriptionKo: "돼지고기가 들어간 전통 김치찌개",
    price: 13.99,
    image: "/placeholder.svg",
    category: "main",
  },
  {
    id: "3",
    name: "Bibimbap",
    nameKo: "비빔밥",
    description: "Mixed rice with vegetables and egg",
    descriptionKo: "야채와 계란을 곁들인 비빔밥",
    price: 12.99,
    image: "/placeholder.svg",
    category: "main",
  },
];

export function Menu() {
  const { language, t } = useLanguage();
  const { addItem } = useCart();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">{t('menu.title')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Card key={item.id} className="overflow-hidden animate-fade-in">
            <img
              src={item.image}
              alt={language === 'en' ? item.name : item.nameKo}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold">
                {language === 'en' ? item.name : item.nameKo}
              </h3>
              <p className="text-gray-600 mt-2">
                {language === 'en' ? item.description : item.descriptionKo}
              </p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-lg font-bold">${item.price}</span>
                <Button onClick={() => addItem(item)}>{t('item.add')}</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}