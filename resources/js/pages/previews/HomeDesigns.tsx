import HomeRefresh from './HomeRefresh';

export default function HomeDesigns({ initialDesign = 1 }: { initialDesign?: number }) {
    return <HomeRefresh initialDesign={initialDesign} showPicker />;
}
