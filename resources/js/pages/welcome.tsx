import HomeRefresh from './previews/HomeRefresh';

export default function Welcome({ initialDesign = 1 }: { initialDesign?: number }) {
    return <HomeRefresh initialDesign={initialDesign} showPicker={false} />;
}
