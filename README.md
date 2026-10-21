# BOOST’27 — kompletna strona

Wersja z 21 października 2026: płynne kolorowe tło, centralne białe logo i efekt narastającego drżenia po przytrzymaniu.

## Szybki start

Folder `site` to cała działająca strona. Czyste HTML, CSS i JavaScript, bez frameworka, instalowania paczek, backendu czy kluczy API.

1. Rozpakuj ZIP.
2. Otwórz folder projektu w swoim edytorze (np. VS Code lub Cursor).
3. Uruchom lokalny serwer w folderze `site`, np. jeśli masz Python 3:

```bash
cd site
python3 -m http.server 8000
```

4. Otwórz `http://localhost:8000` w przeglądarce.

Możesz też użyć dowolnego serwera statycznego / podglądu z edytora. Nie uruchamiaj pliku wyłącznie dwuklikiem: animacja wykorzystuje tekstury i działa poprawnie przez HTTP/HTTPS.

## Co edytować

- `site/index.html` — treść, logo, data, link do Instagrama, metadane.
- `site/style.css` — układ, rozmiary, wersja mobilna, wygląd interakcji.
- `site/app.js` — przenikanie kolorów, płynny ruch, przytrzymanie logo, drżenie i uwolnienie napięcia.
- `site/assets/` — wszystkie używane tła, oryginalne logo, font i informacje licencyjne fontów.

## Animacja

- `fadeDuration = 9000` w `app.js` ustala bazową długość przejścia; mniejsza wartość przyspiesza zmianę kolorów.
- W funkcji `frame` mnożnik `1.15 + charge*1.1 + energy*3.8` steruje przyspieszaniem.
- `charge + dt/2350` określa czas przytrzymania do uwolnienia napięcia: 2350 ms.
- Funkcja `updateBoost` steruje narastaniem drżenia, krótkim odbiciem i wygaszeniem efektu.
- `setupFluid` renderuje tła za pomocą WebGL. Gdy WebGL jest niedostępne, działa alternatywa na warstwach CSS.
- Logo działa myszą i dotykiem. Spacja: przytrzymanie. Enter: automatyczne naładowanie. Escape: anulowanie ładowania.
- Przycisk w prawym górnym rogu zatrzymuje animację tła.

## Publikacja gdzie indziej

Prześlij zawartość folderu `site` na dowolny hosting statyczny. `index.html` musi znajdować się w katalogu głównym publikowanej strony. Nie ma etapu kompilacji.

Na usługach takich jak Vercel, Netlify czy Cloudflare Pages ustaw projekt jako statyczny / bez frameworka, wskaż folder `site` jako katalog publikowany i pozostaw komendę budowania pustą. Jeśli importujesz sam folder `site` jako projekt, publikowanym katalogiem jest jego katalog główny.

Przed publikacją pod własną domeną możesz ustawić pełny adres `og:image` w `index.html`, aby podgląd linku w komunikatorach wskazywał na `https://TWOJA-DOMENA/assets/boost-brand-background.jpeg`.

## Ważne

To samodzielny eksport najnowszej strony. Nie wymaga ChatGPT ani konta OpenAI. Nie zawiera danych logowania, tokenów, konfiguracji dostępu ani historii Git. Obecna strona w ChatGPT pozostaje niezależna od tej kopii.

Teksty i materiały marki zachowują dotychczasowe prawa. Informacje o licencjach fontów znajdują się w `site/assets/font-notices.txt`.
