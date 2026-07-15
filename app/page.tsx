import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Calendar, Users, Wifi, BookOpen } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="text-white">
              <h1 className="text-5xl font-bold tracking-tight mb-6 text-balance">Умное рабочее пространство НГТУ</h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Бронируйте комфортные коворкинг-зоны в любом корпусе университета. Работайте эффективно в современной
                среде с доступом ко всем ресурсам.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                  <Link href="/map">Посмотреть карту</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 bg-transparent"
                >
                  <Link href="/booking">Забронировать место</Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white">
                    <MapPin className="w-5 h-5" />
                    <span className="text-lg">Выберите корпус</span>
                  </div>
                  <div className="flex items-center gap-3 text-white">
                    <Calendar className="w-5 h-5" />
                    <span className="text-lg">Укажите время</span>
                  </div>
                  <div className="flex items-center gap-3 text-white">
                    <Users className="w-5 h-5" />
                    <span className="text-lg">Забронируйте место</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Почему UniSpace?</h2>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Удобное расположение</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Коворкинг-зоны во всех корпусах НГТУ. Работайте рядом с аудиториями.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Wifi className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Современное оснащение</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Быстрый Wi-Fi, розетки, мониторы и проекторы для продуктивной работы.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Доступ к ресурсам</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Интеграция с библиотекой для быстрого доступа к учебным материалам.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Rules Section */}
      <section className="py-16 px-4 bg-amber-50 dark:bg-amber-100/10 border-t border-b">
        <div className="container mx-auto max-w-5xl">
          <Card className="border-amber-200 dark:border-amber-900/40">
            <CardContent className="pt-6">
              <h3 className="text-2xl font-bold mb-4">Правила пользования коворкингом</h3>
              <ol className="list-decimal pl-6 space-y-2 text-sm md:text-base">
                <li>Не мусорить</li>
                <li>Не ругаться матом</li>
                <li>Всегда оставляйте место чистым</li>
                <li>Использовать ПК только для рабочих задач</li>
                <li>Не приходить в нетрезвом состоянии</li>
              </ol>
              <div className="mt-4 text-sm text-muted-foreground">
                Санкции за невыполнение: Блокировка от 1 до 364 дней.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Zones Section */}
      <section className="py-20 px-4 bg-muted">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4">Типы рабочих зон</h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">Выберите пространство под ваши задачи</p>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-6xl mb-2">🤫</div>
                  <h3 className="text-2xl font-bold">Тихая зона</h3>
                </div>
              </div>
              <CardContent className="pt-6">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Для индивидуальной углубленной работы. Полная тишина и концентрация.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Изолированные места
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Индивидуальное освещение
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-6xl mb-2">👥</div>
                  <h3 className="text-2xl font-bold">Групповая зона</h3>
                </div>
              </div>
              <CardContent className="pt-6">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Для командной работы над проектами и РГЗ. Обсуждения приветствуются.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Маркерные доски
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Общие мониторы
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-6xl mb-2">☕</div>
                  <h3 className="text-2xl font-bold">Неформальная зона</h3>
                </div>
              </div>
              <CardContent className="pt-6">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Для мозговых штурмов и отдыха. Комфортная атмосфера с кофе.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Мягкие кресла
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Кофе-зона
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4">Команда проекта</h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">Люди, которые создали UniSpace</p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="text-center border-2 hover:border-primary transition-colors">
              <CardContent className="pt-6">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 bg-muted">
                 <Image src="/team/1.jpg" alt="Анна Петрова" width={64} height={64} className="w-full h-full object-cover" />
              </div>
                <h3 className="text-lg font-semibold mb-1">Анна Петрова</h3>
                <p className="text-sm text-muted-foreground">Руководитель проекта</p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-secondary transition-colors">
              <CardContent className="pt-6">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 bg-muted">
                 <Image src="/team/2.jpg" alt="Евгений Науменко" width={64} height={64} className="w-full h-full object-cover" />
              </div>
                <h3 className="text-lg font-semibold mb-1">Евгений Науменко</h3>
                <p className="text-sm text-muted-foreground">Разработчик</p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-accent transition-colors">
              <CardContent className="pt-6">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 bg-muted">
                 <Image src="/team/3.jpg" alt="Ксения Кулуева" width={64} height={64} className="w-full h-full object-cover" />
              </div>
                <h3 className="text-lg font-semibold mb-1">Ксения Кулуева</h3>
                <p className="text-sm text-muted-foreground">Оценщик</p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-primary transition-colors">
              <CardContent className="pt-6">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 bg-muted">
                 <Image src="/team/4.jpg" alt="Софья Сенникова" width={64} height={64} className="w-full h-full object-cover" />
              </div>
                <h3 className="text-lg font-semibold mb-1">Софья Сенникова</h3>
                <p className="text-sm text-muted-foreground">Контроллер</p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-secondary transition-colors">
              <CardContent className="pt-6">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 bg-muted">
                 <Image src="/team/5.jpg" alt="Кристина Метковская" width={64} height={64} className="w-full h-full object-cover" />
              </div>
                <h3 className="text-lg font-semibold mb-1">Кристина Метковская</h3>
                <p className="text-sm text-muted-foreground">Аналитик</p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-accent transition-colors">
              <CardContent className="pt-6">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 bg-muted">
                 <Image src="/team/6.jpg" alt="Иван Машинков" width={64} height={64} className="w-full h-full object-cover" />
              </div>
                <h3 className="text-lg font-semibold mb-1">Иван Машинков</h3>
                <p className="text-sm text-muted-foreground">Работяга</p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-primary transition-colors">
              <CardContent className="pt-6">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 bg-muted">
                 <Image src="/team/7.jpg" alt="Юлия Шипанова" width={64} height={64} className="w-full h-full object-cover" />
              </div>
                <h3 className="text-lg font-semibold mb-1">Юлия Шипанова</h3>
                <p className="text-sm text-muted-foreground">Вдохновитель</p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-secondary transition-colors">
              <CardContent className="pt-6">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 bg-muted">
                 <Image src="/team/8.jpg" alt="Данил Кирсанов" width={64} height={64} className="w-full h-full object-cover" />
              </div>
                <h3 className="text-lg font-semibold mb-1">Данил Кирсанов</h3>
                <p className="text-sm text-muted-foreground">Генератор идей</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Готовы начать?</h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Забронируйте рабочее место прямо сейчас и повысьте свою продуктивность
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/booking">Забронировать место</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/map">Посмотреть все локации</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
