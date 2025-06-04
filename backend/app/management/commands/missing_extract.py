from django.core.management.base import BaseCommand
import re
from pathlib import Path


class Command(BaseCommand):
    help = "Identify missing tile PNGs by scanning known tile URL lists and comparing against expected grid."

    def handle(self, *args, **kwargs):
        tiles_dir = Path("/Users/jacob.moore/Documents/alpha/backend/static/tiles")

        tile_pattern = re.compile(r'floor-(\d+)/(\d+)/(\d+)/(\d+)\.png')
        matched_any = False

        txt_files = list(tiles_dir.glob("tile_urls_floor-*.txt"))
        if not txt_files:
            self.stdout.write(self.style.WARNING("⚠ No tile_urls_floor-*.txt files found."))
            return

        files_processed = 0

        for txt_file in txt_files:
            self.stdout.write(f"📄 Reading {txt_file.name}")
            with open(txt_file, "r") as f:
                lines = f.read().splitlines()

            matches = []
            seen_urls = set()

            for line in lines:
                match = tile_pattern.search(line)
                if match:
                    floor, z, x, y = map(int, match.groups())
                    matches.append((floor, z, x, y))
                    seen_urls.add((x, y))

            if not matches:
                self.stdout.write(f"⚠ No matches found in {txt_file.name}")
                continue

            matched_any = True
            files_processed += 1
            floor = matches[0][0]
            z = matches[0][1]
            xs = [m[2] for m in matches]
            ys = [m[3] for m in matches]

            min_x, max_x = min(xs), max(xs)
            min_y, max_y = min(ys), max(ys)

            self.stdout.write(f"🔍 Floor {floor}, Zoom {z}, X: {min_x}-{max_x}, Y: {min_y}-{max_y}")

            missing_urls = [
                f"https://d2lkgynick4c0n.cloudfront.net/maps/v7/floor-{floor}/{z}/{x}/{y}.png"
                for x in range(min_x, max_x + 1)
                for y in range(min_y, max_y + 1)
                if (x, y) not in seen_urls
            ]

            output_file = tiles_dir / f"{txt_file.stem}_missing.txt"
            with open(output_file, "w") as f:
                f.write("\n".join(missing_urls))

            if missing_urls:
                self.stdout.write(f"✅ {len(missing_urls)} missing tiles written to {output_file.name}")
            else:
                self.stdout.write(f"✅ No missing tiles found for {txt_file.name}")

        if not matched_any:
            self.stdout.write(self.style.WARNING("⚠ No tiles processed from any file."))
        else:
            self.stdout.write(self.style.SUCCESS(f"🎯 Missing tile scan complete. {files_processed} file(s) processed."))
