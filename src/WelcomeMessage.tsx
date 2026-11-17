type Props = { name: string; uncompletedCount: number };
const WelcomeMessage = ({ name, uncompletedCount }: Props) => {
  const hour = new Date().getHours();
  return <p className="welcome-copy">今日の残りは <strong>{uncompletedCount} 件</strong> です。</p>;
};
export default WelcomeMessage;
